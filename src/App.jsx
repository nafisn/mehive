import { useState, useRef, useEffect } from 'react'
import './App.css'
import HoneycombGrid from './components/HoneycombGrid'
import SuperlativeModal from './components/SuperlativeModal'
import SelectionOverlay from './components/SelectionOverlay';
import { toBlob } from 'html-to-image';

function App() {
  // Initial dummy data based on user request
  const initialData = [
    { id: 1, title: 'Best Game', subtitle: 'Escape From Duckov', image: null },
    { id: 2, title: 'Best Book', subtitle: 'Cat\'s Cradle', image: null },
    { id: 3, title: 'Best Movie', subtitle: 'My Dinner with Andre', image: null },
    { id: 4, title: 'Best Album', subtitle: 'Fancy That', image: null },
    { id: 5, title: 'Best Meal', subtitle: 'Yoroniku', image: null },
    { id: 6, title: 'Best Trip', subtitle: 'Japan', image: null },
  ];

  const initialCenterNode = {
    title: "Your Year",
    subtitle: "2025",
    image: null,
    color: '#ffb703',
    isCenter: true
  };

  // Initialize state from localStorage or defaults
  const [superlatives, setSuperlatives] = useState(() => {
    const saved = localStorage.getItem('mehive_superlatives');
    return saved ? JSON.parse(saved) : initialData;
  });

  const [centerNode, setCenterNode] = useState(() => {
    const saved = localStorage.getItem('mehive_center');
    return saved ? JSON.parse(saved) : initialCenterNode;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const gridRef = useRef(null);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('mehive_superlatives', JSON.stringify(superlatives));
    localStorage.setItem('mehive_center', JSON.stringify(centerNode));
  }, [superlatives, centerNode]);

  const handleHexClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (updatedItem) => {
    if (updatedItem.isCenter) {
      setCenterNode(updatedItem);
    } else {
      setSuperlatives(prev => prev.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      ));
    }
  };

  const handleAddHexagon = () => {
    const newId = Math.max(...superlatives.map(s => s.id), 0) + 1;
    const newHex = {
      id: newId,
      title: 'New Category',
      subtitle: 'Description',
      image: null,
      color: '#333333'
    };
    setSuperlatives(prev => [...prev, newHex]);
  };

  const handleDeleteHexagon = (id) => {
    setSuperlatives(prev => prev.filter(item => item.id !== id));
    setIsModalOpen(false);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset everything? This will delete all your customizations.")) {
      localStorage.removeItem('mehive_superlatives');
      localStorage.removeItem('mehive_center');
      setSuperlatives(initialData);
      setCenterNode(initialCenterNode);
      window.location.reload();
    }
  };

  // Start the manual export process
  const handleManualExport = () => {
    setIsSelectionMode(true);
  };

  const handleAutoExport = async () => {
    try {
      const blob = await toBlob(document.body, {
        backgroundColor: '#242424',
        width: window.innerWidth,
        height: window.innerHeight,
        filter: (node) => {
          // Exclude the UI controls and any overlays
          return (!node.classList || !node.classList.contains('ui-controls')) &&
            (!node.classList || !node.classList.contains('selection-overlay'));
        }
      });

      if (!blob) throw new Error("Blob is null");

      const dataUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'MeHive-Snapshot.png';
      link.href = dataUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);

    } catch (err) {
      console.error("Auto-export failed:", err);
      alert("Auto-export failed: " + err.message);
    }
  };

  const handleSelectionCancel = () => {
    setIsSelectionMode(false);
  };

  const handleSelectionConfirm = async (selection) => {
    // 1. Hide the overlay so it's not in the screenshot
    setIsSelectionMode(false);

    // 2. Wait a moment for the UI to update (overlay to disappear)
    await new Promise(resolve => setTimeout(resolve, 100));

    const element = document.getElementById('honeycomb-grid-container'); // Or document.body for full screen
    if (!element) return;

    try {
      // 3. Capture the entire element (or body)
      const blob = await toBlob(document.body, {
        backgroundColor: '#242424',
        width: selection.width,
        height: selection.height,
        style: {
          // We translate the body content so the top-left of the selection becomes (0,0)
          transform: `translate(${-selection.x}px, ${-selection.y}px)`,
          transformOrigin: 'top left',
          width: '100vw', // Keep original size to ensure content renders
          height: '100vh',
          overflow: 'visible'
        },
        filter: (node) => {
          // Exclude the UI controls from the screenshot
          return !node.classList || !node.classList.contains('ui-controls');
        }
      });

      if (!blob) throw new Error("Blob is null");

      const dataUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'MeHive-Selection.png';
      link.href = dataUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);

    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed: " + err.message);
    }
  };

  return (
    <div className="app-container">
      <div id="honeycomb-grid-container">
        <HoneycombGrid
          ref={gridRef}
          items={superlatives}
          centerItem={centerNode}
          onHexagonClick={handleHexClick}
        />
      </div>

      <div className="ui-controls">
        <h1>MeHive</h1>
        <div className="button-group">
          <button className="add-btn" onClick={handleAddHexagon}>
            ➕ Add Hexagon
          </button>
          <button className="export-btn" onClick={handleManualExport} title="Drag to select area">
            ✂️ Manual Export
          </button>
          <button className="export-btn" onClick={handleAutoExport} title="Auto-crop entire grid">
            📸 Auto Export
          </button>
          <button className="reset-btn" onClick={handleReset} style={{ backgroundColor: '#e63946', marginLeft: '10px' }}>
            Reset
          </button>
        </div>
      </div>


      <SuperlativeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        onSave={handleSave}
        onDelete={handleDeleteHexagon}
      />

      {isSelectionMode && (
        <SelectionOverlay
          onConfirm={handleSelectionConfirm}
          onCancel={handleSelectionCancel}
        />
      )}
    </div>
  )
}

export default App
