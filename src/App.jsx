import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'
import HoneycombGrid from './components/HoneycombGrid'
import SuperlativeModal from './components/SuperlativeModal'
import { saveState, loadState, clearState } from './utils/db';

// Initial dummy data - functions to return fresh objects and prevent mutation
const getInitialData = () => [
  { id: 1, title: 'Best Game', subtitle: 'Escape From Duckov', image: null },
  { id: 2, title: 'Best Book', subtitle: 'Cat\'s Cradle', image: null },
  { id: 3, title: 'Best Movie', subtitle: 'One Battle After Another', image: null },
  { id: 4, title: 'Best Album', subtitle: 'Fancy That', image: null },
  { id: 5, title: 'Best Meal', subtitle: 'Yoroniku', image: null },
  { id: 6, title: 'Best Trip', subtitle: 'Japan', image: null },
];

const getInitialCenterNode = () => ({
  title: "Your Year",
  subtitle: "2025",
  image: null,
  color: '#52d053',
  isCenter: true
});

function App() {
  // Maximum hexagons (excluding center node)
  const MAX_HEXAGONS = 18;

  // Initialize state with defaults first
  const [superlatives, setSuperlatives] = useState(getInitialData());
  const [centerNode, setCenterNode] = useState(getInitialCenterNode());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from DB or migrate from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load from IndexedDB (migration from localStorage is one-time only)
        const dbSuperlatives = await loadState('mehive_superlatives');
        if (dbSuperlatives) setSuperlatives(dbSuperlatives);

        const dbCenter = await loadState('mehive_center');
        if (dbCenter) setCenterNode(dbCenter);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const gridRef = useRef(null);

  // Persistence Effect
  useEffect(() => {
    if (!isLoaded) return; // Don't save defaults over DB data before loading
    const saveData = async () => {
      try {
        await saveState('mehive_superlatives', superlatives);
        await saveState('mehive_center', centerNode);
      } catch (error) {
        console.error("Error saving data:", error);
      }
    };
    const timeoutId = setTimeout(saveData, 500); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [superlatives, centerNode, isLoaded]);

  const handleHexClick = useCallback((item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback((updatedItem) => {
    if (updatedItem.isCenter) {
      setCenterNode(updatedItem);
    } else {
      setSuperlatives(prev => prev.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      ));
    }
  }, []);

  const handleAddHexagon = useCallback(() => {
    setSuperlatives(prev => {
      // Check if we've reached the limit
      if (prev.length >= MAX_HEXAGONS) {
        return prev; // Don't add if at limit
      }

      // Optimize ID generation - use reduce instead of Math.max with spread
      const newId = prev.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
      const newHex = {
        id: newId,
        title: 'New Category',
        subtitle: 'Description',
        image: null,
        color: '#52d053'
      };
      return [...prev, newHex];
    });
  }, [MAX_HEXAGONS]);

  const handleDeleteHexagon = useCallback((id) => {
    setSuperlatives(prev => prev.filter(item => item.id !== id));
    setIsModalOpen(false);
  }, []);

  const handleReset = useCallback(async () => {
    if (window.confirm("Are you sure you want to reset everything? This will delete all your customizations.")) {
      await clearState();
      localStorage.removeItem('mehive_superlatives'); // Just in case
      localStorage.removeItem('mehive_center');
      localStorage.removeItem('mehive_layout');
      setSuperlatives(getInitialData());
      setCenterNode(getInitialCenterNode());
      window.location.reload();
    }
  }, []);

  const handleAutoExport = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.exportGrid();
    }
  }, []);

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
        <p className="instructions">double tap to edit, drag to move cells</p>
        <div className="button-group">
          <button
            className="add-btn"
            onClick={handleAddHexagon}
            disabled={superlatives.length >= MAX_HEXAGONS}
            title={superlatives.length >= MAX_HEXAGONS ? "Maximum hexagons reached" : "Add a new hexagon"}
          >
            ➕ Add Hexagon ({superlatives.length}/{MAX_HEXAGONS})
          </button>
          <button className="export-btn" onClick={handleAutoExport} title="Save image of the entire hive">
            📸 Export Hive
          </button>
          <button className="reset-btn" onClick={handleReset} title="Reset all hexagons to default">
            🔄 Reset
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
    </div>
  )
}

export default App
