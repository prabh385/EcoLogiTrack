import math
import random
from typing import List, Dict, Tuple
import json

# ============================================
# FREE DISTANCE CALCULATION
# ============================================

# Punjab cities coordinates (FREE public data)
PUNJAB_CITIES = {
    'ludhiana': {'lat': 30.9010, 'lon': 75.8573, 'name': 'Ludhiana'},
    'jalandhar': {'lat': 31.3260, 'lon': 75.5762, 'name': 'Jalandhar'},
    'amritsar': {'lat': 31.6340, 'lon': 74.8723, 'name': 'Amritsar'},
    'patiala': {'lat': 30.3398, 'lon': 76.3869, 'name': 'Patiala'},
    'bathinda': {'lat': 30.2110, 'lon': 74.9455, 'name': 'Bathinda'},
    'mohali': {'lat': 30.7046, 'lon': 76.7179, 'name': 'Mohali'},
    'hoshiarpur': {'lat': 31.5330, 'lon': 75.9120, 'name': 'Hoshiarpur'},
    'firozpur': {'lat': 30.9257, 'lon': 74.6142, 'name': 'Firozpur'},
    'moga': {'lat': 30.8158, 'lon': 75.1705, 'name': 'Moga'},
    'kapurthala': {'lat': 31.3800, 'lon': 75.3800, 'name': 'Kapurthala'},
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula
    FREE - No API required
    """
    R = 6371  # Earth radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def create_distance_matrix(cities: List[str]) -> List[List[float]]:
    """Create distance matrix from city names"""
    n = len(cities)
    matrix = [[0.0] * n for _ in range(n)]
    
    for i in range(n):
        for j in range(n):
            if i != j:
                city1 = cities[i].lower()
                city2 = cities[j].lower()
                
                if city1 in PUNJAB_CITIES and city2 in PUNJAB_CITIES:
                    coord1 = PUNJAB_CITIES[city1]
                    coord2 = PUNJAB_CITIES[city2]
                    
                    distance = haversine_distance(
                        coord1['lat'], coord1['lon'],
                        coord2['lat'], coord2['lon']
                    )
                    matrix[i][j] = round(distance, 2)
                else:
                    matrix[i][j] = 50.0  # Default distance for unknown cities
    
    return matrix

# ============================================
# GREEDY NEAREST NEIGHBOR ALGORITHM (FREE)
# ============================================

def nearest_neighbor_tsp(distance_matrix: List[List[float]], start: int = 0) -> Tuple[List[int], float]:
    """
    Simple Nearest Neighbor algorithm for TSP
    FREE alternative to complex optimization
    """
    n = len(distance_matrix)
    unvisited = set(range(n))
    current = start
    route = [current]
    unvisited.remove(current)
    total_distance = 0
    
    while unvisited:
        nearest = min(unvisited, key=lambda x: distance_matrix[current][x])
        total_distance += distance_matrix[current][nearest]
        current = nearest
        route.append(current)
        unvisited.remove(current)
    
    # Return to start
    total_distance += distance_matrix[current][start]
    route.append(start)
    
    return route, total_distance

# ============================================
# VEHICLE ROUTING WITH CAPACITY (FREE)
# ============================================

def simple_vrp(cities: List[str], demands: List[int], 
               num_vehicles: int = 3, capacity: int = 1000) -> Dict:
    """
    Simple Vehicle Routing Problem solver
    FREE - No OR-Tools required
    """
    if len(cities) != len(demands):
        raise ValueError("Cities and demands must have same length")
    
    if demands[0] != 0:
        raise ValueError("Depot (first location) must have 0 demand")
    
    # Create distance matrix
    distance_matrix = create_distance_matrix(cities)
    n = len(cities)
    
    # Initialize vehicles
    vehicles = []
    for v in range(num_vehicles):
        vehicles.append({
            'vehicle_id': v + 1,
            'route': [0],  # Start at depot
            'load': 0,
            'distance': 0,
            'cities': ['Depot']
        })
    
    # Track visited locations
    visited = [False] * n
    visited[0] = True  # Depot
    
    # Assign locations to vehicles using greedy approach
    current_vehicle = 0
    
    while not all(visited):
        vehicle = vehicles[current_vehicle]
        current_location = vehicle['route'][-1]
        
        # Find best next location (nearest that fits capacity)
        best_location = None
        best_distance = float('inf')
        
        for i in range(1, n):
            if not visited[i]:
                # Check if demand fits
                if vehicle['load'] + demands[i] <= capacity:
                    dist = distance_matrix[current_location][i]
                    if dist < best_distance:
                        best_distance = dist
                        best_location = i
        
        if best_location is not None:
            # Add location to route
            vehicle['route'].append(best_location)
            vehicle['cities'].append(cities[best_location])
            vehicle['load'] += demands[best_location]
            vehicle['distance'] += best_distance
            visited[best_location] = True
        else:
            # No more locations fit this vehicle, move to next
            # Return to depot
            if vehicle['route'][-1] != 0:
                vehicle['route'].append(0)
                vehicle['cities'].append('Depot')
                vehicle['distance'] += distance_matrix[vehicle['route'][-2]][0]
            
            current_vehicle += 1
            if current_vehicle >= num_vehicles:
                # If all vehicles exhausted but locations remain
                print(f"Warning: {sum(1 for v in visited if not v)} locations couldn't be assigned")
                break
    
    # Close all routes
    for vehicle in vehicles:
        if vehicle['route'][-1] != 0:
            vehicle['route'].append(0)
            vehicle['cities'].append('Depot')
            vehicle['distance'] += distance_matrix[vehicle['route'][-2]][0]
        
        # Round distance
        vehicle['distance'] = round(vehicle['distance'], 2)
    
    # Calculate totals
    total_distance = sum(v['distance'] for v in vehicles)
    
    return {
        'vehicles': vehicles,
        'total_distance': round(total_distance, 2),
        'distance_matrix': distance_matrix
    }
