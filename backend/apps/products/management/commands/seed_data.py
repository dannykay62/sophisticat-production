import io

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.blog.models import BlogPost
from apps.products.models import Category, Coupon, Product, ProductImage

CATEGORIES = [
    {"name": "Jewelry", "slug": "jewelry", "order": 1},
    {"name": "Beaded Bracelets", "slug": "beaded-bracelets", "order": 2},
    {"name": "Turbans", "slug": "turbans", "order": 3},
    {"name": "African Prints & Designs", "slug": "african-prints-designs", "order": 4},
]

PRODUCTS = [
    {"name": "Gold Pendant Necklace", "slug": "gold-pendant-necklace", "category": "jewelry", "price": 45000,
     "description": "A timeless gold-plated pendant necklace that adds elegance to any look. Crafted with premium materials for lasting shine.",
     "features": ["18k Gold Plated", "Hypoallergenic", "Adjustable Chain (16\"-20\")", "Gift Packaging Included"],
     "is_best_seller": True},
    {"name": "Statement Hoop Earrings", "slug": "statement-hoop-earrings", "category": "jewelry", "price": 22000,
     "description": "Bold gold-plated hoops that move effortlessly from everyday wear to evening occasions.",
     "features": ["18k Gold Plated", "Lightweight", "Click-Top Closure", "Hypoallergenic"],
     "is_best_seller": True},
    {"name": "Layered Chain Bracelet", "slug": "layered-chain-bracelet", "category": "jewelry", "price": 28000,
     "description": "Three delicate gold-plated chains layered onto a single clasp for an effortless stacked look.",
     "features": ["18k Gold Plated", "Adjustable Clasp", "Tarnish Resistant"]},
    {"name": "Signet Ring", "slug": "signet-ring", "category": "jewelry", "price": 18000,
     "description": "A classic signet ring with a polished face, sized for a comfortable everyday fit.",
     "features": ["18k Gold Plated", "Available in sizes 5-10", "Tarnish Resistant"]},

    {"name": "Turquoise Beaded Bracelet", "slug": "turquoise-beaded-bracelet", "category": "beaded-bracelets", "price": 12000,
     "description": "Hand-strung turquoise beads on an elastic band, designed to stack beautifully with our other pieces.",
     "features": ["Genuine Turquoise Beads", "Elastic Fit", "Handmade"],
     "is_best_seller": True},
    {"name": "Multicolor Waist Bead Set", "slug": "multicolor-waist-bead-set", "category": "beaded-bracelets", "price": 15000,
     "description": "A vibrant set of traditional waist beads, hand-strung and finished with a secure clasp.",
     "features": ["Handmade", "Adjustable Length", "Set of 3"]},
    {"name": "Wooden Bead Bracelet", "slug": "wooden-bead-bracelet", "category": "beaded-bracelets", "price": 9000,
     "description": "Natural wooden beads strung with brass accents for an earthy, everyday layering piece.",
     "features": ["Natural Wood Beads", "Brass Accents", "Elastic Fit"]},
    {"name": "Coral Statement Bracelet", "slug": "coral-statement-bracelet", "category": "beaded-bracelets", "price": 16000,
     "description": "Chunky coral-tone beads make this a standout piece on its own or stacked with gold jewelry.",
     "features": ["Handmade", "Elastic Fit", "One Size"],
     "is_best_seller": True},

    {"name": "Silk Wrap Turban", "slug": "silk-wrap-turban", "category": "turbans", "price": 25000,
     "description": "A luxurious silk-blend wrap turban, pre-tied with an adjustable band for a secure, polished fit.",
     "features": ["Silk Blend", "Pre-Tied", "Adjustable Band", "One Size"],
     "is_best_seller": True},
    {"name": "Ankara Print Turban", "slug": "ankara-print-turban", "category": "turbans", "price": 18000,
     "description": "A bold Ankara-print turban that pairs easily with both traditional and modern outfits.",
     "features": ["100% Cotton", "Pre-Tied", "One Size"]},
    {"name": "Gele Head Wrap", "slug": "gele-head-wrap", "category": "turbans", "price": 32000,
     "description": "A statement gele head wrap for weddings and special occasions, in a stiffened fabric that holds its shape.",
     "features": ["Aso-Oke Fabric", "Pre-Shaped", "Occasion Wear"]},
    {"name": "Everyday Jersey Turban", "slug": "everyday-jersey-turban", "category": "turbans", "price": 12000,
     "description": "A soft, stretchy jersey turban for comfortable daily wear.",
     "features": ["Jersey Knit", "Stretch Fit", "Machine Washable"]},

    {"name": "Ankara Wrap Dress", "slug": "ankara-wrap-dress", "category": "african-prints-designs", "price": 38000,
     "description": "A flattering wrap-style dress in vibrant Ankara print, tailored for an easy, comfortable fit.",
     "features": ["100% Cotton Ankara", "Tie Waist", "Available in sizes S-XL"],
     "is_best_seller": True},
    {"name": "Kente Print Scarf", "slug": "kente-print-scarf", "category": "african-prints-designs", "price": 14000,
     "description": "A lightweight scarf in a classic Kente-inspired print, equally at home as a wrap or accessory.",
     "features": ["Lightweight Fabric", "60\" x 20\"", "Hand Wash"]},
    {"name": "Dashiki Print Top", "slug": "dashiki-print-top", "category": "african-prints-designs", "price": 26000,
     "description": "A relaxed-fit top in bold Dashiki print, designed to pair effortlessly with denim or wrap skirts.",
     "features": ["100% Cotton", "Relaxed Fit", "Available in sizes S-XL"]},
    {"name": "Ankara Clutch Bag", "slug": "ankara-clutch-bag", "category": "african-prints-designs", "price": 20000,
     "description": "A structured clutch in Ankara print with a gold-tone chain strap for hands-free wear.",
     "features": ["Ankara Fabric Exterior", "Gold-Tone Chain", "Interior Zip Pocket"],
     "is_best_seller": True},
]

COUPONS = [
    {"code": "SOPHISTICAT10", "discount_percent": 10},
    {"code": "WELCOME15", "discount_percent": 15},
]

BLOG_POSTS = [
    {
        "title": "5 Ways to Style Beaded Bracelets This Season",
        "slug": "style-beaded-bracelets",
        "excerpt": "From minimal stacks to statement pieces — how to wear beaded bracelets for every occasion.",
        "category": "Style Guide",
        "read_time": "4 min read",
        "content": (
            "Beaded bracelets are one of the easiest ways to add color and texture to an outfit without overthinking it.\n"
            "Start with a base of 2-3 thin bracelets in complementary tones, then add one statement piece as a focal point.\n"
            "Mixing bead sizes and materials — wood, glass, stone — keeps a stack looking curated rather than cluttered.\n"
            "For everyday wear, keep to a single color family; save bold multicolor sets for occasions."
        ),
    },
    {
        "title": "The Art of Tying a Turban",
        "slug": "art-of-tying-a-turban",
        "excerpt": "A step-by-step guide to getting a polished, secure turban wrap every time.",
        "category": "Style Guide",
        "read_time": "5 min read",
        "content": (
            "A well-tied turban starts with the right fabric — silk blends hold their shape better than pure cotton for formal looks.\n"
            "Begin at the nape of the neck and wrap forward, keeping tension even so the fabric doesn't loosen through the day.\n"
            "For a fuller silhouette, wrap a soft scarf underneath as padding before adding your turban.\n"
            "Finish by tucking the tail neatly at the side or securing it with a decorative pin for a statement touch."
        ),
    },
    {
        "title": "Caring for Your Ankara Pieces",
        "slug": "caring-for-ankara-pieces",
        "excerpt": "Keep your prints vibrant for years with the right washing and storage habits.",
        "category": "Care Guide",
        "read_time": "4 min read",
        "content": (
            "Ankara fabric holds its color best when washed in cold water, inside out, to protect the print from friction.\n"
            "Avoid direct sunlight when drying — line dry in shade to prevent the vibrant dyes from fading over time.\n"
            "Iron on the reverse side on a medium setting; direct high heat on the printed side can dull the pattern.\n"
            "Store folded rather than hung where possible, to keep structured pieces like dresses from stretching out of shape."
        ),
    },
]


def make_placeholder_image(label: str) -> ContentFile:
    """Generates a simple red/gold placeholder image so seeded products
    always have a valid ProductImage file, even without real photography."""
    from PIL import Image, ImageDraw

    img = Image.new("RGB", (800, 1000), color="#3D0B0B")
    draw = ImageDraw.Draw(img)
    draw.rectangle([40, 40, 760, 960], outline="#A6701F", width=3)
    draw.text((400, 500), label.upper(), fill="#C9A24B", anchor="mm")
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    return ContentFile(buffer.getvalue(), name=f"{label}.jpg")


class Command(BaseCommand):
    help = "Seeds the database with Sophisticat demo categories, products, coupons, and blog posts."

    def handle(self, *args, **options):
        self.stdout.write("Seeding categories...")
        category_map = {}
        for c in CATEGORIES:
            category, _ = Category.objects.update_or_create(
                slug=c["slug"], defaults={"name": c["name"], "order": c["order"]}
            )
            category_map[c["slug"]] = category

        self.stdout.write("Seeding products...")
        for p in PRODUCTS:
            product, created = Product.objects.update_or_create(
                slug=p["slug"],
                defaults={
                    "name": p["name"],
                    "category": category_map[p["category"]],
                    "price": p["price"],
                    "compare_at_price": p.get("compare_at_price"),
                    "description": p["description"],
                    "features": p["features"],
                    "is_best_seller": p.get("is_best_seller", False),
                    "stock_quantity": 50,
                },
            )
            if created or not product.images.exists():
                ProductImage.objects.create(
                    product=product,
                    image=make_placeholder_image(product.name),
                    alt_text=product.name,
                    order=0,
                )

        self.stdout.write("Seeding coupons...")
        now = timezone.now()
        for coupon in COUPONS:
            Coupon.objects.update_or_create(
                code=coupon["code"],
                defaults={
                    "discount_percent": coupon["discount_percent"],
                    "is_active": True,
                    "valid_from": now,
                    "valid_until": now.replace(year=now.year + 1),
                },
            )

        self.stdout.write("Seeding blog posts...")
        for post in BLOG_POSTS:
            BlogPost.objects.update_or_create(
                slug=post["slug"],
                defaults={
                    "title": post["title"],
                    "excerpt": post["excerpt"],
                    "content": post["content"],
                    "category": post["category"],
                    "read_time": post["read_time"],
                    "image": make_placeholder_image(post["title"][:20]),
                },
            )

        self.stdout.write(self.style.SUCCESS(
            f"Done — seeded {len(CATEGORIES)} categories, {len(PRODUCTS)} products, "
            f"{len(COUPONS)} coupons, {len(BLOG_POSTS)} blog posts."
        ))
