function parseShipment(rawData) {
  const uniqueShipments = [];
  const seenSkus = {};

  for (let i = 0; i < rawData.length; i++) {
    const [sku, name, qty, expires, zone] = rawData[i].split("|");

    if (seenSkus[sku] === true) {
      continue;
    }
    seenSkus[sku] = true;

    const cleanedItem = {
      sku: sku,
      name: name,
      qty: Number(qty),
      expires: expires,
      zone: zone || "general"
    };

    uniqueShipments.push(cleanedItem);
  }
  return uniqueShipments;
}

function planRestock(pantry, shipment) {
  const actions = [];

  for (let i = 0; i < shipment.length; i++) {
    const currentShipmentItem = shipment[i];

    if (currentShipmentItem.qty <= 0) {
      actions.push({
        type: "discard",
        item: currentShipmentItem
      });
      continue;
    }

    let foundInPantry = false;

    for (let j = 0; j < pantry.length; j++) {
      if (pantry[j].sku === currentShipmentItem.sku) {
        foundInPantry = true;
        break;
      }
    }

    if (foundInPantry === true) {
      actions.push({
        type: "restock",
        item: currentShipmentItem
      });
    } else {
      actions.push({
        type: "donate",
        item: currentShipmentItem
      });
    }
  }
  return actions;
}

function groupByZone(actions) {
  const zones = {};

  for (let i = 0; i < actions.length; i++) {
    const currentAction = actions[i];
    const zoneName = currentAction.item.zone;

    if (!zones[zoneName]) {
      zones[zoneName] = [];
    }
    zones[zoneName].push(currentAction);
  }
  return zones;
}

function clonePantry(pantry) {
  return pantry.map(item => {
    return { ...item };
  });
}

const samplePantry = [
  {
    sku: "SKU1",
    name: "Apple Juice",
    qty: 10,
    expires: "01-01-2026",
    zone: "fridge"
  }
];

const sampleRawData = [
  "SKU1|Apple Juice|5|2026-10-01|fridge",
  "SKU2|Almond Milk|0|2026-09-12|fridge",
  "SKU3|Canned Beans|12|2027-01-15"
];

const clonedInventory = clonePantry(samplePantry);
const processedShipment = parseShipment(sampleRawData);
const actionPlan = planRestock(clonedInventory, processedShipment);

const finalGroupedActions = groupByZone(actionPlan);

console.log(finalGroupedActions);
