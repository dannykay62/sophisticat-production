from rest_framework import permissions, viewsets

from .models import BlogPost
from .serializers import BlogPostDetailSerializer, BlogPostListSerializer


class BlogPostViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BlogPost.objects.filter(is_published=True)
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    search_fields = ["title", "excerpt"]
    filterset_fields = ["category"]
    pagination_class = None

    def get_serializer_class(self):
        return BlogPostDetailSerializer if self.action == "retrieve" else BlogPostListSerializer
