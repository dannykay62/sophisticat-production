import uuid

from django.db import models
from django.utils.text import slugify


class BlogPost(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    excerpt = models.CharField(max_length=300)
    content = models.TextField(help_text="One paragraph per line")
    image = models.ImageField(upload_to="blog/")
    category = models.CharField(max_length=100)
    read_time = models.CharField(max_length=20, default="5 min read")
    is_published = models.BooleanField(default=True)
    published_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-published_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def content_paragraphs(self):
        return [p for p in self.content.split("\n") if p.strip()]
