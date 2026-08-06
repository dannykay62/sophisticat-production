import { Testimonial, FAQItem } from "@/types";

// Product, category, and blog data all come from the live Django API now
// (see src/lib/api/). This file holds only static marketing/reference
// content that has no backend model — testimonials and FAQ copy.

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Adaeze O.",
    location: "Lagos, Nigeria",
    quote:
      "The Gold Pendant Necklace is even more beautiful in person. It feels substantial, not like the flimsy gold-plated pieces I've bought before.",
    rating: 5,
    avatar: "avatar-1",
  },
  {
    id: "t2",
    name: "Folake A.",
    location: "Abuja, Nigeria",
    quote:
      "My silk turban gets compliments every single time I wear it. The fabric holds its shape all day, even in Lagos heat.",
    rating: 5,
    avatar: "avatar-2",
  },
  {
    id: "t3",
    name: "Chiamaka N.",
    location: "Port Harcourt, Nigeria",
    quote:
      "Delivery was fast, packaging felt intentional, and the Ankara wrap dress fit perfectly. Already eyeing my next order.",
    rating: 5,
    avatar: "avatar-3",
  },
];

export const faqs: FAQItem[] = [
  {
    question: "How long does delivery take?",
    answer: "Orders within Lagos arrive in 1-3 working days. Other states across Nigeria take 3-5 working days.",
  },
  {
    question: "Is your jewelry hypoallergenic?",
    answer: "Yes. All Sophisticat jewelry is nickel-free and hypoallergenic, plated in 18k gold over sterling silver or brass.",
  },
  {
    question: "What is your returns policy?",
    answer: "We accept returns within 14 days of delivery, provided items are unworn and in original packaging.",
  },
  {
    question: "Do you offer gift wrapping?",
    answer: "Every Sophisticat order ships in complimentary signature packaging, ready to gift.",
  },
  {
    question: "Which payment methods do you accept?",
    answer: "We accept debit and credit cards via Stripe, or cards, bank transfer, and USSD via Paystack.",
  },
];
