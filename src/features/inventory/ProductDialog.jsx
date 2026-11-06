import { useEffect, useId, useMemo, useState } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { SelectField } from '../../components/ui/SelectField';
import { Icon } from '../../components/ui/Icon';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';
import { CATEGORIES } from '../../data/seed';

const EMPTY_VALUES = {
  name: '',
  sku: '',
  category: '',
  supplierId: '',
  price: '',
  cost: '',
  quantity: '0',
  reorderPoint: '',
  location: '',
};

export function ProductDialog({ open, onClose, product = null }) {
  const { products, suppliers, addProduct, updateProduct } = useStore();
  const { showToast } = useToast();
  const formId = useId();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});

  const categories = useMemo(
    () =>
      [...new Set([...CATEGORIES, ...products.map((item) => item.category)])].sort(),
    [products],
  );

  const supplierOptions = useMemo(
    () => [
      { value: '', label: 'No supplier' },
      ...suppliers.map((supplier) => ({
        value: supplier.id,
        label: supplier.name,
      })),
    ],
    [suppliers],
  );

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      product
        ? {
            name: product.name,
            sku: product.sku,
            category: product.category,
            supplierId: product.supplierId || '',
            price: String(product.price),
            cost: String(product.cost),
            quantity: String(product.quantity),
            reorderPoint: String(product.reorderPoint),
            location: product.location || '',
          }
        : EMPTY_VALUES,
    );
  }, [open, product]);

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = 'Enter a product name.';
    if (!values.sku.trim()) {
      next.sku = 'Enter a unique SKU.';
    } else {
      const duplicate = products.some(
        (item) =>
          item.sku.toLowerCase() === values.sku.trim().toLowerCase() &&
          item.id !== product?.id,
      );
      if (duplicate) next.sku = 'That SKU is already in use.';
    }
    if (!values.category) next.category = 'Choose a category.';
    if (values.price === '' || Number(values.price) < 0) {
      next.price = 'Enter a selling price (0 or more).';
    }
    if (values.cost !== '' && Number(values.cost) < 0) {
      next.cost = 'Cost cannot be negative.';
    }
    if (
      values.reorderPoint === '' ||
      Number(values.reorderPoint) < 0 ||
      !Number.isInteger(Number(values.reorderPoint))
    ) {
      next.reorderPoint = 'Enter a whole number (0 or more).';
    }
    if (
      !product &&
      (values.quantity === '' ||
        Number(values.quantity) < 0 ||
        !Number.isInteger(Number(values.quantity)))
    ) {
      next.quantity = 'Enter a whole number (0 or more).';
    }
    return next;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (product) {
      updateProduct(product.id, values);
      showToast(`Updated ${values.name.trim()}.`);
    } else {
      addProduct(values);
      showToast(`${values.name.trim()} added to inventory.`);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={product ? 'Edit product' : 'Add product'}
      description={
        product
          ? 'Update the product details. Stock levels change through stock movements.'
          : 'Create a catalog item. You can record stock after saving.'
      }
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} icon="check">
            {product ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <form id={formId} className="form-grid" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Product name"
          value={values.name}
          onChange={setField('name')}
          error={errors.name}
          required
          autoComplete="off"
          data-autofocus
          className="form-grid__full"
          maxLength={80}
        />
        <TextField
          label="SKU"
          value={values.sku}
          onChange={setField('sku')}
          error={errors.sku}
          supportingText="A unique code, for example AUR-HP-01."
          required
          autoComplete="off"
          maxLength={24}
        />
        <TextField
          label="Location"
          value={values.location}
          onChange={setField('location')}
          supportingText="Shelf or bin reference."
          autoComplete="off"
          maxLength={16}
        />
        <SelectField
          label="Category"
          value={values.category}
          onChange={setField('category')}
          options={categories.map((category) => ({
            value: category,
            label: category,
          }))}
          placeholder="Choose a category"
          error={errors.category}
          required
        />
        <SelectField
          label="Supplier"
          value={values.supplierId}
          onChange={setField('supplierId')}
          options={supplierOptions}
        />
        <TextField
          label="Selling price (₹)"
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={values.price}
          onChange={setField('price')}
          error={errors.price}
          required
        />
        <TextField
          label="Unit cost (₹)"
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={values.cost}
          onChange={setField('cost')}
          error={errors.cost}
        />
        <TextField
          label="Reorder point"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={values.reorderPoint}
          onChange={setField('reorderPoint')}
          error={errors.reorderPoint}
          supportingText="Alert when stock reaches this level."
          required
        />

        {product ? (
          <div className="form-note form-grid__full">
            <Icon name="info" size={20} />
            <p className="md-body-small">
              Current stock is <strong>{product.quantity} units</strong>. Use a
              stock movement to receive or issue units so the change stays
              auditable.
            </p>
          </div>
        ) : (
          <TextField
            label="Opening stock"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={values.quantity}
            onChange={setField('quantity')}
            error={errors.quantity}
            supportingText="Units on hand right now."
            className="form-grid__full"
          />
        )}
      </form>
    </Dialog>
  );
}
