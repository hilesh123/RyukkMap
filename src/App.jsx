import React, { useState, useEffect } from 'react';
import { Map, Circle, MessageSquare, Ghost, User, Navigation, Plus, X, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import "./App.css"
import { peopleData } from './data';


// Custom icons
const ghostIcon = L.divIcon({
  html: `<div class="ghost-marker">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 10h.01"></path>
      <path d="M15 10h.01"></path>
      <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"></path>
    </svg>
  </div>`,
  className: 'ghost-icon',
  iconSize: [30, 30]
});

const livingIcon = L.divIcon({
  html: `<div class="living-marker">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  </div>`,
  className: 'living-icon',
  iconSize: [30, 30]
});

// Map Center Component to focus on searched person
const MapCenter = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);
  return null;
};

// Routing Control Component
const RoutingControl = ({ start, end }) => {
  const map = useMap();

  useEffect(() => {
    if (!start || !end) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      routeWhileDragging: false,
      lineOptions: {
        styles: [{ color: '#6366F1', weight: 4 }]
      },
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, start, end]);

  return null;
};

const DashboardLayout = () => {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState([8.5241, 76.9366]);
  const [mapZoom] = useState(13);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [filteredPeople, setFilteredPeople] = useState(peopleData);
  const [focusPosition, setFocusPosition] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntity, setNewEntity] = useState({
    type: 'ghost',
    name: '',
    age: '',
    details: '',
    position: [8.5241, 76.9366],
    deathDate: '',
    deathReason: '',
    occupation: '',
    health: '',
    dailyRoutine: ''
  });

  // Analytics Data
  const getAnalyticsData = () => {
    const ghostCount = peopleData.filter(p => p.type === 'ghost').length;
    const livingCount = peopleData.filter(p => p.type === 'living').length;
    
    const pieData = [
      { name: 'Ghosts', value: ghostCount },
      { name: 'Living', value: livingCount }
    ];

    const ageData = peopleData.map(person => ({
      name: person.name.split(' ')[0],
      age: person.age,
      type: person.type
    }));

    return { pieData, ageData };
  };

  const { pieData, ageData } = getAnalyticsData();
  const COLORS = ['#9333ea', '#2563eb'];

  // Get user's location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error("Error getting location:", error);
        setUserLocation(mapCenter);
      }
    );
  }, []);

  // Handle search
  useEffect(() => {
    const filtered = peopleData.filter(person =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.type === 'ghost' && person.deathReason.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredPeople(filtered);

    if (filtered.length === 1) {
      setFocusPosition(filtered[0].position);
      setSelectedPerson(filtered[0]);
    }
  }, [searchQuery]);

  const handlePersonClick = (person) => {
    setSelectedPerson(person);
    setSelectedRoute(null);
    setFocusPosition(person.position);
  };

  const handleShowRoute = (targetLocation) => {
    if (userLocation) {
      setSelectedRoute({
        start: userLocation,
        end: targetLocation
      });
    }
  };

  const handleAddEntity = (e) => {
    e.preventDefault();
    const newId = peopleData.length + 1;
    const entityToAdd = {
      ...newEntity,
      id: newId,
      lastSeen: new Date().toISOString(),
      hauntingPower: newEntity.type === 'ghost' ? 'Moderate' : undefined
    };
    
    peopleData.push(entityToAdd);
    setFilteredPeople([...peopleData]);
    setShowAddModal(false);
    setNewEntity({
      type: 'ghost',
      name: '',
      age: '',
      details: '',
      position: [8.5241, 76.9366],
      deathDate: '',
      deathReason: '',
      occupation: '',
      health: '',
      dailyRoutine: ''
    });
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>Death Reaper Dashboard</h1>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name, death reason, or details..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button 
          className="add-entity-button"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} />
          Add New Entity
        </button>
      </div>

      {/* Analytics Section */}
      <div className="stats-grid">
        <div className="card">
          <div className="card-header">
            <h2>
              <PieChartIcon className="icon" />
              Entity Distribution
            </h2>
          </div>
          <div className="card-content">
            <PieChart width={300} height={200}>
              <Pie
                data={pieData}
                cx={150}
                cy={100}
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>
              <BarChart className="icon" />
              Age Distribution
            </h2>
          </div>
          <div className="card-content">
            <BarChart width={300} height={200} data={ageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="age" fill="#6366F1" />
            </BarChart>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="map-section">
          <div className="card map-card">
            <div className="card-header">
              <h2>
                <Map className="icon" />
                Tracking Map
              </h2>
            </div>
            <div className="card-content">
              <div className="map-container">
                <MapContainer 
                  center={mapCenter} 
                  zoom={mapZoom} 
                  className="map"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  
                  {focusPosition && <MapCenter position={focusPosition} />}
                  
                  {filteredPeople.map((person) => (
                    <Marker
                      key={person.id}
                      position={person.position}
                      icon={person.type === 'ghost' ? ghostIcon : livingIcon}
                      eventHandlers={{
                        click: () => handlePersonClick(person),
                      }}
                    >
                      <Popup>
                        <div className="popup-content">
                          <h3>{person.name}</h3>
                          <p>{person.type === 'ghost' ? '👻 Spirit' : '👤 Living'}</p>
                          <p>{person.details}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {userLocation && (
                    <Marker
                      position={userLocation}
                      icon={L.divIcon({
                        html: '<div class="user-marker">🎯</div>',
                        className: 'user-icon',
                        iconSize: [30, 30]
                      })}
                    >
                      <Popup>Your Location</Popup>
                    </Marker>
                  )}

                  {selectedRoute && (
                    <RoutingControl
                      start={selectedRoute.start}
                      end={selectedRoute.end}
                    />
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="details-section">
          <div className="card details-card">
            <div className="card-header">
              <h2>
                {selectedPerson?.type === 'ghost' ? <Ghost className="icon" /> : <User className="icon" />}
                Entity Details
              </h2>
            </div>
            <div className="card-content">
              {selectedPerson ? (
                <div className="person-details">
                  <h3>{selectedPerson.name}</h3>
                  {selectedPerson.type === 'ghost' ? (
                    <>
                      <p><strong>Status:</strong> Deceased Spirit</p>
                      <p><strong>Death Date:</strong> {selectedPerson.deathDate}</p>
                      <p><strong>Cause:</strong> {selectedPerson.deathReason}</p>
                      <p><strong>Age at Death:</strong> {selectedPerson.age}</p>
                      <p><strong>Last Sighting:</strong> {selectedPerson.lastSeen}</p>
                      <p><strong>Manifestation:</strong> {selectedPerson.manifestationType}</p>
                      <p><strong>Haunting Power:</strong> {selectedPerson.hauntingPower}</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Status:</strong> Living</p>
                      <p><strong>Age:</strong> {selectedPerson.age}</p>
                      <p><strong>Occupation:</strong> {selectedPerson.occupation}</p>
                      <p><strong>Health Status:</strong> {selectedPerson.health}</p>
                      <p><strong>Daily Routine:</strong> {selectedPerson.dailyRoutine}</p>
                      {selectedPerson.equipment && (
                        <p><strong>Equipment:</strong> {selectedPerson.equipment}</p>
                      )}
                      {selectedPerson.specialty && (
                        <p><strong>Specialty:</strong> {selectedPerson.specialty}</p>
                      )}
                    </>
                  )}
                  <p><strong>Additional Details:</strong> {selectedPerson.details}</p>
                  <button 
                    className="route-button"
                    onClick={() => handleShowRoute(selectedPerson.position)}
                  >
                    <Navigation className="icon" />
                    Show Route to Location
                  </button>
                </div>
              ) : (
                <p className="no-selection">Select a person or spirit on the map to view details</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Entity Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Entity</h2>
              <button className="close-button" onClick={() => setShowAddModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEntity} className="add-entity-form">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={newEntity.type}
                  onChange={(e) => setNewEntity({...newEntity, type: e.target.value})}
                >
                  <option value="ghost">Ghost</option>
                  <option value="living">Living Person</option>
                </select>
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  required
                  value={newEntity.name}
                  onChange={(e) => setNewEntity({...newEntity, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  required
                  value={newEntity.age}
                  onChange={(e) => setNewEntity({...newEntity, age: e.target.value})}
                />
              </div>

              {newEntity.type === 'ghost' ? (
                <>
                  <div className="form-group">
                    <label>Death Date</label>
                    <input
                      type="date"
                      required
                      value={newEntity.deathDate}
                      onChange={(e) => setNewEntity({...newEntity, deathDate: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Death Reason</label>
                    <textarea
                      required
                      value={newEntity.deathReason}
                      onChange={(e) => setNewEntity({...newEntity, deathReason: e.target.value})}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Occupation</label>
                    <input
                      type="text"
                      required
                      value={newEntity.occupation}
                      onChange={(e) => setNewEntity({...newEntity, occupation: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Health Status</label>
                    <input
                      type="text"
                      required
                      value={newEntity.health}
                      onChange={(e) => setNewEntity({...newEntity, health: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Daily Routine</label>
                    <textarea
                      required
                      value={newEntity.dailyRoutine}
                      onChange={(e) => setNewEntity({...newEntity, dailyRoutine: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Details</label>
                <textarea
                  required
                  value={newEntity.details}
                  onChange={(e) => setNewEntity({...newEntity, details: e.target.value})}
                />
              </div>

              <button type="submit" className="submit-button">
                Add Entity
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;