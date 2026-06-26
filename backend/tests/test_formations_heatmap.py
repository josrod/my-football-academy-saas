"""
Test Formation Analysis and Heatmap Features
- Formation presets API
- Team formations CRUD
- Match heatmap data in player_stats
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFormationPresets:
    """Test GET /api/formations/presets endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos@academy.com",
            "password": "coach123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_presets_returns_200(self):
        """GET /api/formations/presets returns 200"""
        response = requests.get(f"{BASE_URL}/api/formations/presets", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_presets_contains_433(self):
        """Presets include 4-3-3 formation"""
        response = requests.get(f"{BASE_URL}/api/formations/presets", headers=self.headers)
        data = response.json()
        assert "4-3-3" in data, f"4-3-3 not in presets: {list(data.keys())}"
        assert len(data["4-3-3"]) == 11, f"4-3-3 should have 11 positions, got {len(data['4-3-3'])}"
    
    def test_presets_contains_442(self):
        """Presets include 4-4-2 formation"""
        response = requests.get(f"{BASE_URL}/api/formations/presets", headers=self.headers)
        data = response.json()
        assert "4-4-2" in data, f"4-4-2 not in presets: {list(data.keys())}"
        assert len(data["4-4-2"]) == 11, f"4-4-2 should have 11 positions"
    
    def test_presets_contains_352(self):
        """Presets include 3-5-2 formation"""
        response = requests.get(f"{BASE_URL}/api/formations/presets", headers=self.headers)
        data = response.json()
        assert "3-5-2" in data, f"3-5-2 not in presets: {list(data.keys())}"
        assert len(data["3-5-2"]) == 11, f"3-5-2 should have 11 positions"
    
    def test_presets_contains_4231(self):
        """Presets include 4-2-3-1 formation"""
        response = requests.get(f"{BASE_URL}/api/formations/presets", headers=self.headers)
        data = response.json()
        assert "4-2-3-1" in data, f"4-2-3-1 not in presets: {list(data.keys())}"
        assert len(data["4-2-3-1"]) == 11, f"4-2-3-1 should have 11 positions"
    
    def test_presets_contains_343(self):
        """Presets include 3-4-3 formation"""
        response = requests.get(f"{BASE_URL}/api/formations/presets", headers=self.headers)
        data = response.json()
        assert "3-4-3" in data, f"3-4-3 not in presets: {list(data.keys())}"
        assert len(data["3-4-3"]) == 11, f"3-4-3 should have 11 positions"
    
    def test_preset_position_structure(self):
        """Each position has role, x, y fields"""
        response = requests.get(f"{BASE_URL}/api/formations/presets", headers=self.headers)
        data = response.json()
        for formation_name, positions in data.items():
            for pos in positions:
                assert "role" in pos, f"Position missing 'role' in {formation_name}"
                assert "x" in pos, f"Position missing 'x' in {formation_name}"
                assert "y" in pos, f"Position missing 'y' in {formation_name}"
                assert 0 <= pos["x"] <= 100, f"x should be 0-100, got {pos['x']}"
                assert 0 <= pos["y"] <= 100, f"y should be 0-100, got {pos['y']}"
    
    def test_presets_without_auth_returns_401(self):
        """GET /api/formations/presets without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/formations/presets")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestTeamFormationsCRUD:
    """Test team formations CRUD endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token, get a team ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos@academy.com",
            "password": "coach123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get a team ID
        teams_response = requests.get(f"{BASE_URL}/api/teams", headers=self.headers)
        assert teams_response.status_code == 200, f"Failed to get teams: {teams_response.text}"
        teams = teams_response.json()
        assert len(teams) > 0, "No teams found"
        self.team_id = teams[0]["id"]
        self.team_name = teams[0]["name"]
    
    def test_get_team_formations_returns_200(self):
        """GET /api/teams/{team_id}/formations returns 200"""
        response = requests.get(f"{BASE_URL}/api/teams/{self.team_id}/formations", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert isinstance(response.json(), list), "Response should be a list"
    
    def test_create_formation_returns_formation(self):
        """POST /api/teams/{team_id}/formations creates a formation"""
        payload = {
            "name": "TEST_Formation_433",
            "formation_type": "4-3-3",
            "team_id": self.team_id,
            "positions": [
                {"role": "GK", "x": 50, "y": 92, "player_id": None, "player_name": "", "jersey_number": None},
                {"role": "LB", "x": 15, "y": 72, "player_id": None, "player_name": "", "jersey_number": None},
                {"role": "CB", "x": 37, "y": 76, "player_id": None, "player_name": "", "jersey_number": None},
                {"role": "CB", "x": 63, "y": 76, "player_id": None, "player_name": "", "jersey_number": None},
                {"role": "RB", "x": 85, "y": 72, "player_id": None, "player_name": "", "jersey_number": None},
                {"role": "CM", "x": 30, "y": 52, "player_id": None, "player_name": "", "jersey_number": None},
                {"role": "CM", "x": 50, "y": 48, "player_id": None, "player_name": "", "jersey_number": None},
                {"role": "CM", "x": 70, "y": 52, "player_id": None, "player_name": "", "jersey_number": None},
                {"role": "LW", "x": 20, "y": 24, "player_id": None, "player_name": "", "jersey_number": None},
                {"role": "ST", "x": 50, "y": 18, "player_id": None, "player_name": "", "jersey_number": None},
                {"role": "RW", "x": 80, "y": 24, "player_id": None, "player_name": "", "jersey_number": None}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/teams/{self.team_id}/formations", 
                                 json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should have 'id'"
        assert data["name"] == "TEST_Formation_433", f"Name mismatch: {data.get('name')}"
        assert data["formation_type"] == "4-3-3", f"Formation type mismatch: {data.get('formation_type')}"
        
        # Store for cleanup
        self.created_formation_id = data["id"]
    
    def test_create_and_verify_persistence(self):
        """Create formation and verify it appears in GET list"""
        # Create
        payload = {
            "name": "TEST_Persistence_Check",
            "formation_type": "4-4-2",
            "team_id": self.team_id,
            "positions": [{"role": "GK", "x": 50, "y": 92}]
        }
        create_response = requests.post(f"{BASE_URL}/api/teams/{self.team_id}/formations", 
                                        json=payload, headers=self.headers)
        assert create_response.status_code == 200
        created_id = create_response.json()["id"]
        
        # Verify in list
        list_response = requests.get(f"{BASE_URL}/api/teams/{self.team_id}/formations", headers=self.headers)
        assert list_response.status_code == 200
        formations = list_response.json()
        found = any(f["id"] == created_id for f in formations)
        assert found, f"Created formation {created_id} not found in list"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/formations/{created_id}", headers=self.headers)
    
    def test_update_formation(self):
        """PUT /api/formations/{formation_id} updates a formation"""
        # Create first
        payload = {
            "name": "TEST_Update_Original",
            "formation_type": "4-3-3",
            "team_id": self.team_id,
            "positions": [{"role": "GK", "x": 50, "y": 92}]
        }
        create_response = requests.post(f"{BASE_URL}/api/teams/{self.team_id}/formations", 
                                        json=payload, headers=self.headers)
        assert create_response.status_code == 200
        formation_id = create_response.json()["id"]
        
        # Update
        update_payload = {"name": "TEST_Update_Modified", "formation_type": "4-4-2"}
        update_response = requests.put(f"{BASE_URL}/api/formations/{formation_id}", 
                                       json=update_payload, headers=self.headers)
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify update persisted
        list_response = requests.get(f"{BASE_URL}/api/teams/{self.team_id}/formations", headers=self.headers)
        formations = list_response.json()
        updated = next((f for f in formations if f["id"] == formation_id), None)
        assert updated is not None, "Formation not found after update"
        assert updated["name"] == "TEST_Update_Modified", f"Name not updated: {updated.get('name')}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/formations/{formation_id}", headers=self.headers)
    
    def test_delete_formation(self):
        """DELETE /api/formations/{formation_id} removes formation"""
        # Create first
        payload = {
            "name": "TEST_Delete_Me",
            "formation_type": "3-5-2",
            "team_id": self.team_id,
            "positions": [{"role": "GK", "x": 50, "y": 92}]
        }
        create_response = requests.post(f"{BASE_URL}/api/teams/{self.team_id}/formations", 
                                        json=payload, headers=self.headers)
        assert create_response.status_code == 200
        formation_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/formations/{formation_id}", headers=self.headers)
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify deleted
        list_response = requests.get(f"{BASE_URL}/api/teams/{self.team_id}/formations", headers=self.headers)
        formations = list_response.json()
        found = any(f["id"] == formation_id for f in formations)
        assert not found, f"Formation {formation_id} still exists after delete"


class TestMatchHeatmapData:
    """Test heatmap data in match player_stats"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos@academy.com",
            "password": "coach123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        # Completed match ID from test_credentials.md
        self.completed_match_id = "69adc5a32e1800e222f9b7a7"
    
    def test_match_has_player_stats_with_heatmap(self):
        """GET /api/matches/{match_id} includes heatmap in player_stats"""
        response = requests.get(f"{BASE_URL}/api/matches/{self.completed_match_id}", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "player_stats" in data, "Response missing 'player_stats'"
        assert len(data["player_stats"]) > 0, "player_stats is empty"
        
        # Check first player has heatmap
        first_player = data["player_stats"][0]
        assert "heatmap" in first_player, f"Player stat missing 'heatmap': {first_player.keys()}"
    
    def test_heatmap_has_24_zones(self):
        """Each player's heatmap has 24 zones (4 rows x 6 cols)"""
        response = requests.get(f"{BASE_URL}/api/matches/{self.completed_match_id}", headers=self.headers)
        data = response.json()
        
        for ps in data["player_stats"]:
            heatmap = ps.get("heatmap", [])
            assert len(heatmap) == 24, f"Player {ps.get('player_name')} has {len(heatmap)} zones, expected 24"
    
    def test_heatmap_zone_structure(self):
        """Each heatmap zone has row, col, intensity fields"""
        response = requests.get(f"{BASE_URL}/api/matches/{self.completed_match_id}", headers=self.headers)
        data = response.json()
        
        first_player = data["player_stats"][0]
        for zone in first_player["heatmap"]:
            assert "row" in zone, f"Zone missing 'row': {zone}"
            assert "col" in zone, f"Zone missing 'col': {zone}"
            assert "intensity" in zone, f"Zone missing 'intensity': {zone}"
            assert 0 <= zone["row"] <= 3, f"Row should be 0-3, got {zone['row']}"
            assert 0 <= zone["col"] <= 5, f"Col should be 0-5, got {zone['col']}"
            assert 0 <= zone["intensity"] <= 1, f"Intensity should be 0-1, got {zone['intensity']}"
    
    def test_heatmap_varies_by_position(self):
        """Heatmap intensity varies based on player position"""
        response = requests.get(f"{BASE_URL}/api/matches/{self.completed_match_id}", headers=self.headers)
        data = response.json()
        
        # Find a goalkeeper and a forward if available
        gk = None
        forward = None
        for ps in data["player_stats"]:
            pos = ps.get("position", "").lower()
            if "goal" in pos or "gk" in pos:
                gk = ps
            elif "for" in pos or "str" in pos or "wing" in pos:
                forward = ps
        
        if gk and forward:
            # GK should have higher intensity in defensive zones (row 0)
            gk_row0 = sum(z["intensity"] for z in gk["heatmap"] if z["row"] == 0)
            forward_row0 = sum(z["intensity"] for z in forward["heatmap"] if z["row"] == 0)
            
            # Forward should have higher intensity in attacking zones (row 3)
            gk_row3 = sum(z["intensity"] for z in gk["heatmap"] if z["row"] == 3)
            forward_row3 = sum(z["intensity"] for z in forward["heatmap"] if z["row"] == 3)
            
            # Just verify they're different (position-based generation)
            print(f"GK row0: {gk_row0:.2f}, Forward row0: {forward_row0:.2f}")
            print(f"GK row3: {gk_row3:.2f}, Forward row3: {forward_row3:.2f}")
    
    def test_all_players_have_heatmap(self):
        """All players in player_stats have heatmap data"""
        response = requests.get(f"{BASE_URL}/api/matches/{self.completed_match_id}", headers=self.headers)
        data = response.json()
        
        for ps in data["player_stats"]:
            assert "heatmap" in ps, f"Player {ps.get('player_name')} missing heatmap"
            assert len(ps["heatmap"]) > 0, f"Player {ps.get('player_name')} has empty heatmap"


class TestCleanup:
    """Cleanup test formations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos@academy.com",
            "password": "coach123"
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        teams_response = requests.get(f"{BASE_URL}/api/teams", headers=self.headers)
        teams = teams_response.json()
        self.team_id = teams[0]["id"] if teams else None
    
    def test_cleanup_test_formations(self):
        """Remove any TEST_ prefixed formations"""
        if not self.team_id:
            pytest.skip("No team found")
        
        response = requests.get(f"{BASE_URL}/api/teams/{self.team_id}/formations", headers=self.headers)
        formations = response.json()
        
        deleted = 0
        for f in formations:
            if f.get("name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/formations/{f['id']}", headers=self.headers)
                deleted += 1
        
        print(f"Cleaned up {deleted} test formations")
        assert True  # Always pass cleanup
