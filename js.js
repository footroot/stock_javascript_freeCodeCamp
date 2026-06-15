// =========================================================================
// YOUR WORKING CORE LOGIC FUNCTIONS
// =========================================================================
function parseShipment(rawData) {
  const shipmentMap = {};

  rawData.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const [sku, name, qty, expires, zone] = trimmed.split("|");
    const numericQty = Number(qty) || 0;

    if (shipmentMap[sku]) {
      shipmentMap[sku].qty += numericQty;
    } else {
      shipmentMap[sku] = { sku, name, qty: numericQty, expires, zone: zone || "general" };
    }
  });

  return Object.values(shipmentMap);
}

function planRestock(pantry, shipment) {
  // Create a Set of SKUs in the pantry for O(1) lookup time
  const pantrySkus = new Set(pantry.map(item => item.sku));
  const actions = [];

  shipment.forEach(item => {
    if (item.qty <= 0) {
      actions.push({ type: "discard", item });
    } else if (pantrySkus.has(item.sku)) {
      actions.push({ type: "restock", item });
    } else {
      actions.push({ type: "donate", item });
    }
  });

  return actions;
}

function groupByZone(actions) {
  const zones = {};
  for (let i = 0; i < actions.length; i++) {
    const currentAction = actions[i];
    const zoneName = currentAction.item.zone;
    if (!zones[zoneName]) zones[zoneName] = [];
    zones[zoneName].push(currentAction);
  }
  return zones;
}

function clonePantry(pantry) {
  return pantry.map(item => ({ ...item }));
}

// =========================================================================
// NEW DOM INTEGRATION: Wire up buttons & dynamically create the HTML UI
// =========================================================================
document.getElementById('processBtn').addEventListener('click', () => {
  const pantryText = document.getElementById('pantryInput').value;
  const shipmentText = document.getElementById('shipmentInput').value;
  const dashboard = document.getElementById('dashboard');

  try {
    // 1. Get current states from textareas
    const rawPantryArray = JSON.parse(pantryText);
    const rawShipmentLines = shipmentText.split('\n');

    // 2. Run through your complete analytical pipeline
    const clonedPantry = clonePantry(rawPantryArray);
    const processedShipment = parseShipment(rawShipmentLines);
    const actionPlan = planRestock(clonedPantry, processedShipment);
    const groupedResults = groupByZone(actionPlan);

    // 3. Wipe current visuals clear
    dashboard.innerHTML = '';

    // 4. Loop through grouped fields and systematically mount HTML columns
    for (const zone in groupedResults) {
      const zoneColumn = document.createElement('div');
      zoneColumn.className = 'zone-column';
      zoneColumn.innerHTML = `<h3>📦 Zone: ${zone}</h3>`;

      // Build cards for items assigned to this column
      groupedResults[zone].forEach(action => {
        const card = document.createElement('div');
        card.className = `action-card ${action.type}`;
        card.innerHTML = `
          <p class="action-tag">[${action.type}]</p>
          <p class="item-title">${action.item.name}</p>
          <p>SKU: ${action.item.sku} | Qty: ${action.item.qty}</p>
        `;
        zoneColumn.appendChild(card);
      });

      dashboard.appendChild(zoneColumn);
    }
  } catch (error) {
    alert("Make sure your Pantry Input data is valid JSON syntax!");
    console.error(error);
  }
});