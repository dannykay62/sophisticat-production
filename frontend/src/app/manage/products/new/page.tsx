import { PageHeader } from "../../components/ui";
import ProductForm from "../ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="New product" description="Add a new product to the catalog." />
      <ProductForm />
    </div>
  );
}


