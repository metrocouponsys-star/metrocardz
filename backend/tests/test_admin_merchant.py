import pytest
from app.models.merchant import Merchant, MerchantUser
from app.models.card import CardInventoryItem
from app.models.admin import AdminAuditLog
from app.core.security import hash_password

def test_admin_modify_and_delete_merchant(client, db_session):
    # 1. Create a super_admin user
    super_admin = MerchantUser(
        id="sa-test-id",
        merchant_id=None,
        name="Super Admin",
        phone="9000000000",
        email="superadmin@metrocardz.in",
        role="super_admin",
        password_hash=hash_password("adminpass123"),
    )
    db_session.add(super_admin)

    # 2. Create a merchant with an owner
    merchant = Merchant(
        id="merch-to-edit-and-delete",
        business_name="Original Name Salon",
        category="Salon",
        plan_tier="Starter",
        whatsapp_number="919111111111",
        address="100 Main St",
        status="active",
        approval_status="approved",
        secret_salt="salt-123",
    )
    db_session.add(merchant)
    db_session.flush()

    owner = MerchantUser(
        id="owner-merch-test",
        merchant_id=merchant.id,
        name="Original Owner",
        phone="9111111111",
        email="orig@owner.com",
        role="owner",
        password_hash=hash_password("ownerpass123"),
    )
    db_session.add(owner)

    # 3. Allocate a card to this merchant
    card = CardInventoryItem(
        id="card-test-alloc",
        card_number="1234 5678 9012 3456",
        status="merchant_allocated",
        allocated_merchant_id=merchant.id,
    )
    db_session.add(card)

    # 4. Create an audit log referencing this merchant
    audit = AdminAuditLog(
        id="audit-test-log",
        admin_user_id=super_admin.id,
        merchant_id=merchant.id,
        action="test_action",
    )
    db_session.add(audit)
    db_session.commit()

    # Login as Super Admin
    login_resp = client.post("/api/v1/auth/login", json={"phone": "9000000000", "password": "adminpass123"})
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify merchant list includes owner info
    list_resp = client.get("/api/v1/admin/merchants", headers=headers)
    assert list_resp.status_code == 200
    merchants = list_resp.json()
    target_m = next((m for m in merchants if m["id"] == merchant.id), None)
    assert target_m is not None
    assert target_m["owner_name"] == "Original Owner"
    assert target_m["owner_phone"] == "9111111111"

    # Test Modify Merchant (PATCH)
    patch_payload = {
        "business_name": "Updated Luxury Spa",
        "category": "Spa & Wellness",
        "plan_tier": "Enterprise",
        "whatsapp_number": "919222222222",
        "address": "200 Luxury Blvd",
        "status": "suspended",
        "approval_status": "approved",
        "referral_bonus_points": 75,
        "owner_name": "Updated Owner Name",
        "owner_phone": "9222222222",
        "owner_email": "updated@owner.com",
    }
    patch_resp = client.patch(f"/api/v1/admin/merchants/{merchant.id}", json=patch_payload, headers=headers)
    assert patch_resp.status_code == 200, patch_resp.text
    updated_data = patch_resp.json()
    assert updated_data["business_name"] == "Updated Luxury Spa"
    assert updated_data["category"] == "Spa & Wellness"
    assert updated_data["plan_tier"] == "Enterprise"
    assert updated_data["status"] == "suspended"
    assert updated_data["owner_name"] == "Updated Owner Name"
    assert updated_data["owner_phone"] == "9222222222"

    # Test Delete Merchant (DELETE)
    del_resp = client.delete(f"/api/v1/admin/merchants/{merchant.id}", headers=headers)
    assert del_resp.status_code == 204, del_resp.text

    # Verify merchant is deleted
    get_del = client.get(f"/api/v1/admin/merchants/{merchant.id}/detail", headers=headers)
    assert get_del.status_code == 404

    # Verify card was unassigned and status reverted to unassigned
    db_session.refresh(card)
    assert card.allocated_merchant_id is None
    assert card.status == "unassigned"

    # Verify audit log merchant_id was nullified
    db_session.refresh(audit)
    assert audit.merchant_id is None
