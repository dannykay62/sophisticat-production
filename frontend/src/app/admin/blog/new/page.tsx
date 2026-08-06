import { PageHeader } from "../../components/ui";
import BlogPostForm from "../BlogPostForm";

export default function NewBlogPostPage() {
  return (
    <div>
      <PageHeader title="New blog post" description="Write a new post for the storefront journal." />
      <BlogPostForm />
    </div>
  );
}
