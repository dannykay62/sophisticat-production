export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export type OrderStatus = "processing" | "shipped" | "out-for-delivery" | "delivered" | "cancelled";

export interface OrderItem {
  productSlug: string;
  productName: string;
  imageKey: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  total: number;
  trackingNumber: string;
  items: OrderItem[];
  shippingAddress: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
}

// Categories are fully admin-managed (see the Django admin's Products >
// Categories) — any slug an admin creates is valid, so this is a plain
// string rather than a fixed union.
export type ProductCategory = string;

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  /** Real photo URL from the API/Cloudinary. When present, components
   * should render this instead of the gradient placeholder. */
  src?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  price: number; // in NGN
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  images: ProductImage[];
  description: string;
  features: string[];
  inStock: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  image: string;
  imageSrc?: string;
  category: ProductCategory;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  quote: string;
  rating: number;
  avatar: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  imageSrc?: string;
  date: string;
  category: string;
  readTime: string;
  content: string[];
}
