from fastapi.testclient import TestClient
from main import app
import os

client = TestClient(app)

def test_full_flow():
    print("1. Probando GET /api/status...")
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    print("   -> Status OK. SAP running:", data["sap_gui"]["running"])

    print("2. Probando POST /api/transports/seed-sample...")
    res = client.post("/api/transports/seed-sample")
    assert res.status_code == 200
    sample = res.json()
    assert sample["numero_transporte"] == "3417089"
    assert sample["cliente"] == "COMERCIAL DOLLINCO S.A."
    assert sample["total_skus"] == 35
    assert sample["cantidad_pallet"] == 3
    print("   -> Seed OK. Total SKUs:", sample["total_skus"])

    print("3. Probando GET /api/transports...")
    res = client.get("/api/transports")
    assert res.status_code == 200
    transports = res.json()
    assert len(transports) >= 1
    print(f"   -> List OK. Total transportes: {len(transports)}")

    print("4. Probando PATCH /api/transports/3417089 (actualizar pallets y fase)...")
    res = client.patch("/api/transports/3417089", json={
        "cantidad_pallet": 5,
        "preparado": "En Preparación",
        "despachado": "En Andén",
        "fase_global": "En Andén"
    })
    assert res.status_code == 200
    updated = res.json()
    assert updated["cantidad_pallet"] == 5
    assert updated["despachado"] == "En Andén"
    print("   -> Patch resumen OK. Pallets ahora:", updated["cantidad_pallet"])

    print("5. Probando PATCH /api/transports/3417089/items (actualizar cantidad de SKU 3071)...")
    res = client.patch("/api/transports/3417089/items", json={
        "sku": "3071",
        "cantidad_preparada": 2.0
    })
    assert res.status_code == 200
    updated_items = res.json()
    sku_3071 = next(i for i in updated_items["items"] if i["sku"] == "3071")
    assert sku_3071["cantidad_preparada"] == 2.0
    assert sku_3071["diferencia_preparacion"] == 1.0
    assert sku_3071["tiene_diferencias"] == "Si"
    print("   -> Patch ítem OK. SKU 3071 diferencia calculada:", sku_3071["diferencia_preparacion"])

    print("6. Probando GET /api/transports/3417089/export-excel...")
    res = client.get("/api/transports/3417089/export-excel")
    assert res.status_code == 200
    assert len(res.content) > 5000
    print("   -> Export Excel individual OK. Bytes:", len(res.content))

    print("7. Probando GET /api/transports/export-excel/all...")
    res = client.get("/api/transports/export-excel/all")
    assert res.status_code == 200
    assert len(res.content) > 5000
    print("   -> Export Excel consolidado OK. Bytes:", len(res.content))

    print("8. Probando GET /api/sap/macro-code...")
    res = client.get("/api/sap/macro-code?tknum=3417089")
    assert res.status_code == 200
    macro = res.json()
    assert "3417089" in macro["vba_macro"]
    assert "vl06o" in macro["vba_macro"]
    print("   -> Macro code generation OK.")

    print("\n[OK] TODOS LOS ENDPOINTS Y REGLAS DE NEGOCIO VERIFICADOS EXITOSAMENTE.")

if __name__ == "__main__":
    test_full_flow()
