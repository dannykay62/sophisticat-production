from rest_framework import serializers

from .models import BlogPost


class BlogPostListSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = ["id", "slug", "title", "excerpt", "image", "category", "read_time", "published_at"]


class BlogPostDetailSerializer(serializers.ModelSerializer):
    content = serializers.ListField(source="content_paragraphs", read_only=True)

    class Meta:
        model = BlogPost
        fields = ["id", "slug", "title", "excerpt", "content", "image", "category", "read_time", "published_at"]
