"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProduct, AdminProductDetail } from "@/lib/api/admin";
import { PageHeader, Banner, LoadingRows } from "../../components/ui";
import ProductForm from "../ProductForm";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct(params.id)
      .then(setProduct)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load product."));
  }, [params.id]);

  return (
    <div>
      <PageHeader title="Edit product" description={product?.name} />
      {error && <Banner tone="error">{error}</Banner>}
      {!product && !error ? <LoadingRows /> : product ? <ProductForm product={product} /> : null}
    </div>
  );
}
