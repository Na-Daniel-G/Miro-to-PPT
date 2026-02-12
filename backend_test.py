import requests
import sys
import json
from datetime import datetime

class MiroBridgeAPITester:
    def __init__(self, base_url="https://miro-bridge.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout}s")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_get_board_data(self):
        """Test GET /api/board - mock Miro board data"""
        success, response = self.run_test("Get Board Data", "GET", "board", 200)
        
        if success:
            # Validate structure
            required_fields = ['id', 'name', 'frames', 'sticky_notes']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field: {field}")
                    return False, response
            
            print(f"   Board Name: {response['name']}")
            print(f"   Frames: {len(response['frames'])}")
            print(f"   Sticky Notes: {len(response['sticky_notes'])}")
            
            # Check if we have expected 4 frames and 17 notes
            if len(response['frames']) == 4 and len(response['sticky_notes']) == 17:
                print("✅ Board data structure matches expected mock data")
            else:
                print(f"⚠️  Expected 4 frames and 17 notes, got {len(response['frames'])} frames and {len(response['sticky_notes'])} notes")
                
        return success, response

    def test_get_mapped_board(self):
        """Test GET /api/board/mapped - frames with mapped sticky notes"""
        success, response = self.run_test("Get Mapped Board", "GET", "board/mapped", 200)
        
        if success:
            # Validate structure
            required_fields = ['board_id', 'board_name', 'frames_with_notes']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field: {field}")
                    return False, response
            
            print(f"   Board Name: {response['board_name']}")
            print(f"   Frames with Notes: {len(response['frames_with_notes'])}")
            
            total_notes = sum(frame['note_count'] for frame in response['frames_with_notes'])
            print(f"   Total Mapped Notes: {total_notes}")
            
            # Check each frame has expected structure
            for i, frame_data in enumerate(response['frames_with_notes']):
                frame_fields = ['frame', 'notes', 'note_count']
                for field in frame_fields:
                    if field not in frame_data:
                        print(f"❌ Frame {i} missing field: {field}")
                        return False, response
                        
            print("✅ All frames have correct mapping structure")
                
        return success, response

    def test_ai_summarization(self):
        """Test POST /api/summarize - AI summarization with Claude"""
        test_data = {
            "notes": ["Increase market share by 25%", "Launch mobile app by Q2", "Expand to 3 new regions"],
            "frame_title": "Goals & Vision"
        }
        
        # Use longer timeout for AI processing
        success, response = self.run_test("AI Summarization", "POST", "summarize", 200, test_data, timeout=60)
        
        if success:
            # Validate AI response structure
            required_fields = ['title', 'bullets']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field: {field}")
                    return False, response
            
            print(f"   Generated Title: {response['title']}")
            print(f"   Generated Bullets: {len(response['bullets'])}")
            
            # Check bullets are a list and not empty
            if isinstance(response['bullets'], list) and len(response['bullets']) > 0:
                print("✅ AI generated proper slide content")
                for i, bullet in enumerate(response['bullets'][:3]):  # Show first 3
                    print(f"   • {bullet}")
            else:
                print(f"❌ Invalid bullets format or empty: {response['bullets']}")
                return False, response
                
        return success, response

    def test_summarize_all_frames(self):
        """Test POST /api/summarize-all - bulk summarization"""
        success, response = self.run_test("Summarize All Frames", "POST", "summarize-all", 200, timeout=120)
        
        if success:
            # Validate bulk summarization structure
            required_fields = ['board_name', 'slides']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field: {field}")
                    return False, response
            
            print(f"   Board Name: {response['board_name']}")
            print(f"   Generated Slides: {len(response['slides'])}")
            
            # Check each slide structure
            for i, slide_data in enumerate(response['slides']):
                slide_fields = ['frame_id', 'frame_title', 'slide', 'raw_notes']
                for field in slide_fields:
                    if field not in slide_data:
                        print(f"❌ Slide {i} missing field: {field}")
                        return False, response
                        
                # Check slide content structure
                slide_content = slide_data['slide']
                if 'title' not in slide_content or 'bullets' not in slide_content:
                    print(f"❌ Slide {i} content missing title or bullets")
                    return False, response
                    
            print("✅ All slides generated with correct structure")
                
        return success, response

    def test_miro_status(self):
        """Test GET /api/miro/status - Miro OAuth connection status"""
        success, response = self.run_test("Miro OAuth Status", "GET", "miro/status", 200)
        
        if success:
            # Validate structure
            required_fields = ['connected', 'configured']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field: {field}")
                    return False, response
            
            print(f"   Connected: {response['connected']}")
            print(f"   Configured: {response['configured']}")
            
            if response['configured']:
                print("✅ Miro OAuth is properly configured")
            else:
                print("❌ Miro OAuth not configured - check MIRO_CLIENT_ID/SECRET")
                
        return success, response

    def test_miro_auth_redirect(self):
        """Test GET /api/miro/auth - OAuth redirect (expect redirect response)"""
        # This should redirect, so we expect either 302 or 500 if not configured
        url = f"{self.api_url}/miro/auth"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing Miro OAuth Redirect...")
        print(f"   URL: {url}")
        
        try:
            # Don't follow redirects to test the redirect response
            response = requests.get(url, headers=headers, allow_redirects=False, timeout=10)
            
            if response.status_code in [302, 307]:
                self.tests_passed += 1
                print(f"✅ Passed - Got redirect: {response.status_code}")
                location = response.headers.get('location', '')
                if 'miro.com/oauth/authorize' in location:
                    print("✅ Redirecting to Miro OAuth correctly")
                else:
                    print(f"⚠️  Redirect location: {location}")
                return True, {'redirect_url': location}
            elif response.status_code == 500:
                print(f"❌ Failed - OAuth not configured properly: {response.status_code}")
                return False, {}
            else:
                print(f"❌ Failed - Unexpected status: {response.status_code}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_get_templates(self):
        """Test GET /api/templates - get available slide templates"""
        success, response = self.run_test("Get Slide Templates", "GET", "templates", 200)
        
        if success:
            # Validate structure
            if 'templates' not in response:
                print(f"❌ Missing templates field")
                return False, response
            
            templates = response['templates']
            print(f"   Available Templates: {len(templates)}")
            
            # Check if professional template exists
            if 'professional' in templates:
                prof_template = templates['professional']
                required_fields = ['name', 'header_color', 'accent_color', 'title_color']
                
                print(f"   Professional Template Found:")
                for field in required_fields:
                    if field in prof_template:
                        print(f"     {field}: {prof_template[field]}")
                    else:
                        print(f"❌ Professional template missing field: {field}")
                        return False, response
                        
                # Check if it has dark blue header as specified
                if prof_template.get('header_color') == '1E3A5F':
                    print("✅ Professional template has correct dark blue header")
                else:
                    print(f"⚠️  Header color: {prof_template.get('header_color')}, expected: 1E3A5F")
                    
            else:
                print("❌ Professional template not found")
                return False, response
                
            print("✅ Templates endpoint working correctly")
                
        return success, response

def main():
    # Setup
    tester = MiroBridgeAPITester()
    print("🚀 Starting MiroBridge API Tests")
    print(f"   Base URL: {tester.base_url}")
    print(f"   API URL: {tester.api_url}")

    # Run tests in order
    print("\n" + "="*60)
    print("BACKEND API TESTING")
    print("="*60)

    # Test 1: Root endpoint
    tester.test_root_endpoint()

    # Test 2: Basic board data
    success, board_data = tester.test_get_board_data()
    if not success:
        print("❌ Board data test failed - stopping tests")
        return 1

    # Test 3: Mapped board data
    success, mapped_data = tester.test_get_mapped_board()
    if not success:
        print("❌ Mapped board test failed - stopping tests")
        return 1

    # Test 4: AI Summarization
    success, summary_data = tester.test_ai_summarization()
    if not success:
        print("⚠️  AI Summarization failed - may be API key or connectivity issue")
        
    # Test 5: Bulk summarization (optional)
    print("\n🔄 Testing bulk summarization (this may take longer)...")
    success, bulk_data = tester.test_summarize_all_frames()
    if not success:
        print("⚠️  Bulk summarization failed - may be API key or connectivity issue")

    # Print final results
    print("\n" + "="*60)
    print("TEST RESULTS")
    print("="*60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend APIs are working well!")
        return 0
    elif success_rate >= 60:
        print("⚠️  Backend has some issues but core functionality works")
        return 1
    else:
        print("❌ Backend has major issues")
        return 1

if __name__ == "__main__":
    sys.exit(main())