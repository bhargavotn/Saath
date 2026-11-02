import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.authentication.models import UserProfile
from apps.counselor_profiles.models import CounselorProfile, CounselorReview
from apps.trauma_feed.models import TraumaStory
from apps.session_management.models import CounselingSession
from apps.mood_tracking.models import MoodCheckIn

print("Seeding Counselor Platform Database in 100% English...")

# 1. Default Client Profile
client_user, _ = UserProfile.objects.get_or_create(
    email="aarav.client@counselor.ai",
    defaults={
        "full_name": "Aarav Sharma",
        "user_type": "CLIENT",
        "preferred_language": "English",
        "is_anonymous_mode": True,
        "phone_number_encrypted": "+91 •••••• 4120",
        "bio": "Working in tech, managing silent anxiety and burnout."
    }
)

# 2. Counselors (Clinical & Licensed)
counselors_data = [
    {
        "email": "dr.ananya.sen@counselor.ai",
        "name": "Dr. Ananya Sen",
        "qualification": "M.Phil Clinical Psychology (RCI Licensed)",
        "photo": "https://images.unsplash.com/photo-1594824813637-299f2420a4b7?auto=format&fit=crop&w=400&q=80",
        "story": "Having navigated clinical depression and familial loss in my early twenties, I learned that healing begins when someone doesn't try to 'fix' you, but sits in the dark with you until dawn. My sessions are an unhurried, safe sanctuary.",
        "license": "RCI-CRR-A19482",
        "specialties": ["Anxiety & Panic", "Trauma & PTSD", "Grief Recovery"],
        "languages": ["English", "Hindi"],
        "exp": 9,
        "rate_min": 20.00,
        "rate_hr": 850.00,
        "online": True,
        "rating": 4.96,
        "sessions": 1420
    },
    {
        "email": "rohan.varma@counselor.ai",
        "name": "Counselor Rohan Varma",
        "qualification": "MA Counseling Psychology, Relationship Specialist",
        "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
        "story": "Breakups and toxic family expectations often make people doubt their core dignity. I help clients reclaim their emotional boundaries, rebuild self-worth, and find peace after emotional betrayal.",
        "license": "IACP-M2941",
        "specialties": ["Heartbreak & Breakups", "Family & Marriage", "Self-Worth"],
        "languages": ["English", "Hindi"],
        "exp": 7,
        "rate_min": 18.00,
        "rate_hr": 750.00,
        "online": True,
        "rating": 4.91,
        "sessions": 980
    },
    {
        "email": "meenakshi.sundaram@counselor.ai",
        "name": "Dr. Meenakshi Sundaram",
        "qualification": "Senior Psychotherapist & MBSR Specialist",
        "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
        "story": "South Asian perfectionism and corporate burnout take a silent, brutal toll on mental health. I provide evidence-based mindfulness and CBT tools to calm your nervous system and help you sleep without dread.",
        "license": "RCI-CRR-M84920",
        "specialties": ["Workplace Burnout", "High-Functioning Anxiety", "Academic Stress"],
        "languages": ["English", "Tamil"],
        "exp": 12,
        "rate_min": 22.00,
        "rate_hr": 950.00,
        "online": False,
        "rating": 4.98,
        "sessions": 2150
    },
    {
        "email": "dr.kavita.patel@counselor.ai",
        "name": "Dr. Kavita Patel",
        "qualification": "Consultant Psychiatrist (MD, DPM)",
        "photo": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        "story": "Mental health is medical health. As a psychiatrist, I combine clinical medicine with psychotherapy to help patients recover from severe depression, bipolar mood shifts, and persistent panic.",
        "license": "MCI-REG-74921",
        "specialties": ["Clinical Depression", "Bipolar & Mood Shifts", "Panic Disorder"],
        "languages": ["English", "Hindi", "Gujarati"],
        "exp": 14,
        "rate_min": 30.00,
        "rate_hr": 1400.00,
        "online": True,
        "rating": 4.97,
        "sessions": 3200
    }
]

for item in counselors_data:
    u, _ = UserProfile.objects.get_or_create(
        email=item["email"],
        defaults={"full_name": item["name"], "user_type": "COUNSELOR", "preferred_language": "English"}
    )
    c, created = CounselorProfile.objects.get_or_create(
        user=u,
        defaults={
            "display_name": item["name"],
            "qualification": item["qualification"],
            "profile_photo_url": item["photo"],
            "personal_story": item["story"],
            "license_number": item["license"],
            "specialties": item["specialties"],
            "languages_spoken": item["languages"],
            "years_of_experience": item["exp"],
            "rate_per_minute": item["rate_min"],
            "rate_per_hour": item["rate_hr"],
            "is_verified": True,
            "is_available_now": item["online"],
            "total_sessions_completed": item["sessions"],
            "average_rating": item["rating"]
        }
    )
    if not created:
        c.display_name = item["name"]
        c.qualification = item["qualification"]
        c.profile_photo_url = item["photo"]
        c.personal_story = item["story"]
        c.specialties = item["specialties"]
        c.languages_spoken = item["languages"]
        c.rate_per_minute = item["rate_min"]
        c.rate_per_hour = item["rate_hr"]
        c.is_available_now = item["online"]
        c.save()

# 3. Clean English Trauma Sanctuary Stories (Read-Only)
TraumaStory.objects.all().delete()

TraumaStory.objects.create(
    author=client_user,
    content="We were together for 4 years. We planned our entire future together. Two days ago, I found out through mutual friends that their wedding was arranged with someone else and they blocked my number without a word. My chest has felt physically compressed since morning. People tell me to 'move on', but no one understands how heavy waking up feels. Writing this here without fear of judgment gives me a sliver of peace. Please no unsolicited advice—just holding space is enough.",
    category="RELATIONSHIP",
    language="English",
    is_anonymous=True,
    anonymous_alias="BraveSoul_4821",
    support_reaction_count=148
)

TraumaStory.objects.create(
    author=client_user,
    content="Growing up in a household with explosive parental rage made me hyper-vigilant for 20 years. I used to think anticipating violence was a normal survival superpower. In counseling today, I realized my nervous system hasn't felt genuinely safe since I was seven years old. Today, for the first time in my adult life, I allowed myself to cry for one hour straight without apologizing for taking up space.",
    category="TRAUMA",
    language="English",
    is_anonymous=True,
    anonymous_alias="QuietAnchor_88",
    support_reaction_count=230
)

TraumaStory.objects.create(
    author=client_user,
    content="I commute on crowded trains every day and manage 12-hour high-pressure tech sprints. When I unlock my apartment door at midnight, the silence is deafening. My phone only rings with automated notifications. I want to talk to someone, but admitting 'I feel profoundly lonely' feels embarrassing to tell friends. Reading other real people's raw vulnerability in this sanctuary reminded me that silent pain is human, not a personal defect.",
    category="LONELINESS",
    language="English",
    is_anonymous=True,
    anonymous_alias="MidnightVoyager_77",
    support_reaction_count=94
)

print("Database re-seeded with 100% English clinical content!")
