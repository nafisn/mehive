import { useState, useRef, useEffect } from 'react'
import './App.css'
import HoneycombGrid from './components/HoneycombGrid'
import SuperlativeModal from './components/SuperlativeModal'
import { toBlob } from 'html-to-image';
import { saveState, loadState, clearState } from './utils/db';

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

  // Initialize state with defaults first
  const [superlatives, setSuperlatives] = useState(initialData);
  const [centerNode, setCenterNode] = useState(initialCenterNode);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from DB or migrate from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Try migration from localStorage first
        const localSuperlatives = localStorage.getItem('mehive_superlatives');
        const localCenter = localStorage.getItem('mehive_center');

        if (localSuperlatives) {
          const parsed = JSON.parse(localSuperlatives);
          setSuperlatives(parsed);
          await saveState('mehive_superlatives', parsed);
          localStorage.removeItem('mehive_superlatives');
        } else {
          const dbSuperlatives = await loadState('mehive_superlatives');
          if (dbSuperlatives) setSuperlatives(dbSuperlatives);
        }

        if (localCenter) {
          const parsed = JSON.parse(localCenter);
          setCenterNode(parsed);
          await saveState('mehive_center', parsed);
          localStorage.removeItem('mehive_center');
        } else {
          const dbCenter = await loadState('mehive_center');
          if (dbCenter) setCenterNode(dbCenter);
        }
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

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset everything? This will delete all your customizations.")) {
      await clearState();
      localStorage.removeItem('mehive_superlatives'); // Just in case
      localStorage.removeItem('mehive_center');
      setSuperlatives(initialData);
      setCenterNode(initialCenterNode);
      window.location.reload();
    }
  };

  const handleAutoExport = () => {
    if (gridRef.current) {
      gridRef.current.exportGrid();
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
          <button className="export-btn" onClick={handleAutoExport} title="Save image of the entire hive">
            📸 Export Hive
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
    </div>
  )
}

export default App
