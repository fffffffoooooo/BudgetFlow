
import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = 'http://localhost:5000/api'
USER = None
TOKEN = None

# Couleurs pour le terminal
class Colors:
    OK = '\033[92m'  # vert
    FAIL = '\033[91m'  # rouge
    BOLD = '\033[1m'  # gras
    END = '\033[0m'  # reset

def print_test_header(name):
    print(f"\n{Colors.BOLD}=== Test: {name} ==={Colors.END}")

def print_result(success, message=""):
    if success:
        print(f"{Colors.OK}✓ OK{Colors.END} {message}")
    else:
        print(f"{Colors.FAIL}✗ FAIL{Colors.END} {message}")

# ======== Tests d'authentification ========
def test_register():
    print_test_header("Inscription d'un utilisateur")
    
    data = {
        "name": "Test User",
        "email": f"test{datetime.now().timestamp()}@example.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    success = response.status_code == 201
    
    if success:
        resp_data = response.json()
        global USER, TOKEN
        USER = resp_data.get('user')
        TOKEN = resp_data.get('token')
        print_result(True, f"Utilisateur créé: {USER['email']}")
    else:
        print_result(False, f"Code: {response.status_code}, Message: {response.text}")
    
    return success

def test_login():
    print_test_header("Connexion utilisateur")
    
    if not USER:
        print_result(False, "Pas d'utilisateur créé pour tester la connexion")
        return False
    
    data = {
        "email": USER['email'],
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    success = response.status_code == 200
    
    if success:
        resp_data = response.json()
        global TOKEN
        TOKEN = resp_data.get('token')
        print_result(True, f"Connecté en tant que: {USER['email']}")
    else:
        print_result(False, f"Code: {response.status_code}, Message: {response.text}")
    
    return success

def test_profile():
    print_test_header("Récupération du profil")
    
    if not TOKEN:
        print_result(False, "Pas de token pour tester le profil")
        return False
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = requests.get(f"{BASE_URL}/auth/profile", headers=headers)
    success = response.status_code == 200
    
    if success:
        resp_data = response.json()
        print_result(True, f"Profil récupéré pour: {resp_data['user']['email']}")
    else:
        print_result(False, f"Code: {response.status_code}, Message: {response.text}")
    
    return success

# ======== Tests de catégories ========
def test_create_category():
    print_test_header("Création de catégories")
    
    if not TOKEN:
        print_result(False, "Pas de token pour tester la création de catégorie")
        return False
    
    categories = []
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # Créer plusieurs catégories
    for i, (name, color) in enumerate([
        ("Alimentaire", "#3b82f6"),
        ("Transport", "#f59e0b"),
        ("Logement", "#10b981"),
        ("Loisirs", "#8b5cf6")
    ]):
        data = {
            "name": name,
            "color": color,
            "limit": (i + 1) * 200  # Limite différente pour chaque catégorie
        }
        
        response = requests.post(f"{BASE_URL}/categories", headers=headers, json=data)
        success = response.status_code == 201
        
        if success:
            resp_data = response.json()
            category = resp_data.get('category')
            categories.append(category)
            print_result(True, f"Catégorie créée: {category['name']}")
        else:
            print_result(False, f"Échec pour {name}: {response.text}")
    
    # Stocker les catégories créées pour les tests suivants
    global CATEGORIES
    CATEGORIES = categories
    
    return len(categories) > 0

# Variable globale pour stocker les catégories
CATEGORIES = []

# ======== Tests de transactions ========
def test_create_transactions():
    print_test_header("Création de transactions")
    
    if not TOKEN or not CATEGORIES:
        print_result(False, "Pas de token ou de catégories pour tester les transactions")
        return False
    
    transactions = []
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # Dépenses
    for i, category in enumerate(CATEGORIES):
        data = {
            "amount": (i + 1) * 50,
            "type": "expense",
            "categoryId": category['_id'],
            "description": f"Test dépense {i+1}",
            "date": (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        }
        
        response = requests.post(f"{BASE_URL}/transactions", headers=headers, json=data)
        success = response.status_code == 201
        
        if success:
            resp_data = response.json()
            transaction = resp_data.get('transaction')
            transactions.append(transaction)
            print_result(True, f"Dépense créée: {transaction['description']} ({transaction['amount']}€)")
        else:
            print_result(False, f"Échec pour dépense {i+1}: {response.text}")
    
    # Revenus
    for i in range(2):
        data = {
            "amount": 1000 * (i + 1),
            "type": "income",
            "categoryId": CATEGORIES[0]['_id'],  # Utiliser la première catégorie pour les revenus
            "description": f"Test revenu {i+1}",
            "date": datetime.now().strftime('%Y-%m-%d')
        }
        
        response = requests.post(f"{BASE_URL}/transactions", headers=headers, json=data)
        success = response.status_code == 201
        
        if success:
            resp_data = response.json()
            transaction = resp_data.get('transaction')
            transactions.append(transaction)
            print_result(True, f"Revenu créé: {transaction['description']} ({transaction['amount']}€)")
        else:
            print_result(False, f"Échec pour revenu {i+1}: {response.text}")
    
    # Stocker les transactions créées
    global TRANSACTIONS
    TRANSACTIONS = transactions
    
    return len(transactions) > 0

# Variable globale pour stocker les transactions
TRANSACTIONS = []

# ======== Tests de budgets ========
def test_create_budget():
    print_test_header("Création de budgets")
    
    if not TOKEN or not CATEGORIES:
        print_result(False, "Pas de token ou de catégories pour tester les budgets")
        return False
    
    budgets = []
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # Créer un budget pour chaque catégorie
    for i, category in enumerate(CATEGORIES):
        data = {
            "categoryId": category['_id'],
            "amount": (i + 1) * 300,
            "period": "monthly"
        }
        
        response = requests.post(f"{BASE_URL}/budgets", headers=headers, json=data)
        success = response.status_code == 201
        
        if success:
            resp_data = response.json()
            budget = resp_data.get('budget')
            budgets.append(budget)
            print_result(True, f"Budget créé: {budget['amount']}€ pour {category['name']}")
        else:
            print_result(False, f"Échec pour budget {i+1}: {response.text}")
    
    return len(budgets) > 0

# ======== Tests de statistiques ========
def test_get_statistics():
    print_test_header("Récupération des statistiques")
    
    if not TOKEN:
        print_result(False, "Pas de token pour tester les statistiques")
        return False
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # Test statistiques mensuelles
    year = datetime.now().year
    response = requests.get(f"{BASE_URL}/statistics/monthly/{year}", headers=headers)
    success_monthly = response.status_code == 200
    
    if success_monthly:
        monthly_data = response.json().get('data')
        print_result(True, f"Statistiques mensuelles récupérées: {len(monthly_data)} mois")
    else:
        print_result(False, f"Échec des statistiques mensuelles: {response.text}")
    
    # Test statistiques par catégorie
    startDate = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    endDate = datetime.now().strftime('%Y-%m-%d')
    
    response = requests.get(
        f"{BASE_URL}/statistics/by-category?startDate={startDate}&endDate={endDate}", 
        headers=headers
    )
    success_category = response.status_code == 200
    
    if success_category:
        category_data = response.json().get('data')
        print_result(True, f"Statistiques par catégorie récupérées: {len(category_data)} catégories")
    else:
        print_result(False, f"Échec des statistiques par catégorie: {response.text}")
    
    # Test statistiques hebdomadaires
    response = requests.get(f"{BASE_URL}/statistics/weekly", headers=headers)
    success_weekly = response.status_code == 200
    
    if success_weekly:
        weekly_data = response.json().get('data')
        print_result(True, f"Statistiques hebdomadaires récupérées: {len(weekly_data)} jours")
    else:
        print_result(False, f"Échec des statistiques hebdomadaires: {response.text}")
    
    return success_monthly and success_category and success_weekly

# ======== Tests d'export ========
def test_export():
    print_test_header("Export de données")
    
    if not TOKEN:
        print_result(False, "Pas de token pour tester l'export")
        return False
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # Export PDF
    data = {
        "startDate": (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
        "endDate": datetime.now().strftime('%Y-%m-%d')
    }
    
    response = requests.post(f"{BASE_URL}/export/pdf", headers=headers, json=data)
    success_pdf = response.status_code == 200 and response.headers.get('Content-Type') == 'application/pdf'
    
    if success_pdf:
        print_result(True, f"Export PDF réussi ({len(response.content)} octets)")
    else:
        print_result(False, f"Échec de l'export PDF: {response.status_code}")
    
    # Export CSV
    response = requests.post(f"{BASE_URL}/export/csv", headers=headers, json=data)
    success_csv = response.status_code == 200 and response.headers.get('Content-Type') == 'text/csv'
    
    if success_csv:
        print_result(True, f"Export CSV réussi ({len(response.content)} octets)")
    else:
        print_result(False, f"Échec de l'export CSV: {response.status_code}")
    
    return success_pdf and success_csv

# ======== Exécution des tests ========
if __name__ == "__main__":
    print(f"{Colors.BOLD}=== DÉBUT DES TESTS API ==={Colors.END}")
    print(f"URL de base: {BASE_URL}")
    
    tests = [
        ("Inscription", test_register),
        ("Connexion", test_login),
        ("Profil", test_profile),
        ("Catégories", test_create_category),
        ("Transactions", test_create_transactions),
        ("Budgets", test_create_budget),
        ("Statistiques", test_get_statistics),
        ("Export", test_export)
    ]
    
    results = {}
    
    for name, test_func in tests:
        success = test_func()
        results[name] = success
    
    print(f"\n{Colors.BOLD}=== RÉSUMÉ DES TESTS ==={Colors.END}")
    all_passed = True
    
    for name, success in results.items():
        if success:
            print(f"{Colors.OK}✓ {name}: OK{Colors.END}")
        else:
            print(f"{Colors.FAIL}✗ {name}: FAIL{Colors.END}")
            all_passed = False
    
    if all_passed:
        print(f"\n{Colors.OK}{Colors.BOLD}TOUS LES TESTS ONT RÉUSSI !{Colors.END}")
    else:
        print(f"\n{Colors.FAIL}{Colors.BOLD}CERTAINS TESTS ONT ÉCHOUÉ !{Colors.END}")
