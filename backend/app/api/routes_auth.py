from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/start")
def google_auth_start():
    # Phase 3 scaffold endpoint; full OAuth redirect flow lands in a future phase.
    return {"status": "not_implemented", "provider": "google"}


@router.get("/google/callback")
def google_auth_callback():
    return {"status": "not_implemented", "provider": "google"}
