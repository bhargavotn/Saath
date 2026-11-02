from django.contrib import admin
from django.urls import path
from apps.api_views import (
    get_counselors_api,
    immediately_baat_triage_api,
    get_trauma_feed_api,
    react_trauma_story_api,
    post_trauma_story_api,
    peer_compatibility_match_api,
    start_call_session_api,
    clinical_assessment_score_api,
    assessment_history_api,
    get_trauma_groups_api,
    join_trauma_group_api,
    leave_trauma_group_api,
    connect_stranger_api,
    profile_api,
    context_api,
    requests_api,
    request_action_api,
    moods_api,
    auth_register_api,
    auth_login_api,
    auth_logout_api,
    auth_me_api,
)

# Branded Django Administration for Saath Clinical Counseling Platform
admin.site.site_header = "Saath — Mental Health & Clinical Operations"
admin.site.site_title = "Saath Administration"
admin.site.index_title = "Provider Directory, Sanctuary Feed & Clinical Triage"

urlpatterns = [
    path("admin/", admin.site.urls),

    # Real Authentication & User Accounts
    path("api/auth/register/", auth_register_api, name="api_auth_register"),
    path("api/auth/login/", auth_login_api, name="api_auth_login"),
    path("api/auth/logout/", auth_logout_api, name="api_auth_logout"),
    path("api/auth/me/", auth_me_api, name="api_auth_me"),

    # Profile & User Enrollment
    path("api/profile/", profile_api, name="api_profile"),

    # Private Context & Personal Sanctuary Notes
    path("api/context/", context_api, name="api_context"),

    # Session Requests CRUD
    path("api/requests/", requests_api, name="api_requests"),
    path("api/requests/<str:request_id>/", request_action_api, name="api_request_action"),

    # Mood Check-in History & Logging
    path("api/moods/", moods_api, name="api_moods"),

    # Provider & Counselor Directory
    path("api/counselors/", get_counselors_api, name="api_counselors"),

    # Immediate AI Empathy Triage & Crisis Listener
    path("api/triage/", immediately_baat_triage_api, name="api_triage"),

    # Clinical Intake Assessment (PHQ-9 + GAD-7 + Maslach Burnout)
    path("api/assessment/evaluate/", clinical_assessment_score_api, name="api_assessment_evaluate"),
    path("api/assessment/history/", assessment_history_api, name="api_assessment_history"),

    # Circles & Cohort Affinity Pods
    path("api/circles/", get_trauma_groups_api, name="api_circles"),
    path("api/circles/<str:group_id>/join/", join_trauma_group_api, name="api_join_circle"),
    path("api/circles/<str:group_id>/leave/", leave_trauma_group_api, name="api_leave_circle"),
    path("api/trauma-groups/", get_trauma_groups_api, name="api_trauma_groups"),
    path("api/trauma-groups/<str:group_id>/join/", join_trauma_group_api, name="api_join_trauma_group"),
    path("api/trauma-groups/<str:group_id>/leave/", leave_trauma_group_api, name="api_leave_trauma_group"),

    # Trauma Sanctuary Feed
    path("api/trauma-feed/", get_trauma_feed_api, name="api_trauma_feed"),
    path("api/trauma-feed/<str:story_id>/react/", react_trauma_story_api, name="api_react_story"),
    path("api/trauma-feed/create/", post_trauma_story_api, name="api_post_story"),

    # Peer Matching & Stranger Connect
    path("api/stranger-connect/", connect_stranger_api, name="api_stranger_connect"),
    path("api/peer-match/", peer_compatibility_match_api, name="api_peer_match"),

    # E2EE Call Session Initiation
    path("api/sessions/start/", start_call_session_api, name="api_start_call"),
]

