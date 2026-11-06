import { useEffect, useId, useMemo, useState } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { SelectField } from '../../components/ui/SelectField';
import { SegmentedButton } from '../../components/ui/SegmentedButton';
import { Icon } from '../../components/ui/Icon';
import { StockBadge } from '../../components/ui/StockBadge';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';
import { MOVEMENT_REASONS } from '../../data/seed';
import { signedNumber } from '../../utils/format';

const TYPES = [
  { value: 'receive', label: 'Receive', icon: 'add' },
  { value: 'issue', label: 'Issue', icon: 'remove' },
  { value: 'adjust', label: 'Adjust', icon: 'tune' },
];

export function StockDialog({ open, onClose, initialProductId = '' }) {
  const { products, recordMovement } = useStore();
  const { showToast } = useToast();
  const formId = useId();
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('receive');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: `${product.name} · ${product.sku}`,
      })),
    [products],
  );

  const product = products.find((item) => item.id === productId) || null;

  useEffect(() => {
    if (!open) return;
    setProductId(initialProductId || products[0]?.id || '');
    setType('receive');
    setQuantity('');
    setReason(MOVEMENT_REASONS.receive[0]);
    setNote('');
    setErrors({});
  }, [open, initialProductId, products]);

  const handleTypeChange = (nextType) => {
    setType(nextType);
    setReason(MOVEMENT_REASONS[nextType][0]);
    setQuantity('');
    setErrors({});
  };

  const numericQuantity = Number(quantity);
  const validQuantity =
    quantity !== '' && Number.isInteger(numericQuantity) && numericQuantity >= 0;
  const currentStock = product?.quantity ?? 0;
  const nextStock = !validQuantity
    ? null
    : type === 'receive'
      ? currentStock + numericQuantity
      : type === 'issue'
        ? currentStock - numericQuantity
        : numericQuantity;
  const delta = nextStock === null ? null : nextStock - currentStock;

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!productId) next.productId = 'Choose a product.';
    if (quantity === '' || !validQuantity) {
      next.quantity = 'Enter a whole number (0 or more).';
    } else if (type !== 'adjust' && numericQuantity === 0) {
      next.quantity = 'Quantity must be more than zero.';
    } else if (type === 'issue' && numericQuantity > currentStock) {
      next.quantity = `Only ${currentStock} units are available.`;
    }
    if (!reason) next.reason = 'Choose a reason.';

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    recordMovement({
      productId,
      type,
      quantity: numericQuantity,
      reason,
      note,
    });

    const verb =
      type === 'receive' ? 'Received' : type === 'issue' ? 'Issued' : 'Adjusted';
    showToast(
      type === 'adjust'
        ? `Stock for ${product.name} set to ${nextStock} units.`
        : `${verb} ${numericQuantity} unit${numericQuantity === 1 ? '' : 's'} of ${product.name}.`,
    );
    onClose();
  };

  const previewProduct =
    product && nextStock !== null ? { ...product, quantity: nextStock } : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record stock movement"
      description="Every change is timestamped and kept in the movement log."
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            icon="check"
            disabled={products.length === 0}
          >
            Record movement
          </Button>
        </>
      }
    >
      {products.length === 0 ? (
        <div className="form-note">
          <Icon name="inventory_2" size={20} />
          <p className="md-body-small">
            Add a product to the catalog before recording stock movements.
          </p>
        </div>
      ) : (
        <form
          id={formId}
          className="form-grid"
          onSubmit={handleSubmit}
          noValidate
        >
          <SelectField
            label="Product"
            value={productId}
            onChange={(event) => {
              setProductId(event.target.value);
              setErrors((current) => ({ ...current, productId: undefined }));
            }}
            options={productOptions}
            error={errors.productId}
            className="form-grid__full"
          />

          <div className="form-grid__full">
            <SegmentedButton
              options={TYPES}
              value={type}
              onChange={handleTypeChange}
              label="Movement type"
            />
          </div>

          <TextField
            label={
              type === 'adjust'
                ? 'Counted quantity'
                : type === 'receive'
                  ? 'Quantity received'
                  : 'Quantity issued'
            }
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
              setErrors((current) => ({ ...current, quantity: undefined }));
            }}
            error={errors.quantity}
            supportingText={
              product
                ? type === 'issue'
                  ? `${currentStock} units available · ${product.reorderPoint} reorder point`
                  : `Currently ${currentStock} units on hand`
                : undefined
            }
            data-autofocus
            required
          />
          <SelectField
            label="Reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setErrors((current) => ({ ...current, reason: undefined }));
            }}
            options={MOVEMENT_REASONS[type].map((item) => ({
              value: item,
              label: item,
            }))}
            error={errors.reason}
            required
          />
          <TextField
            label="Reference or note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            supportingText="Optional. Add a PO, order, or return reference."
            autoComplete="off"
            maxLength={120}
            className="form-grid__full"
          />

          {product && nextStock !== null ? (
            <div className="stock-preview form-grid__full" aria-live="polite">
              <div className="stock-preview__item">
                <span className="md-body-small text-muted">Current stock</span>
                <span className="md-title-medium">{currentStock} units</span>
              </div>
              <Icon name="arrow_forward" size={20} />
              <div className="stock-preview__item">
                <span className="md-body-small text-muted">After movement</span>
                <span className="md-title-medium">{nextStock} units</span>
              </div>
              <div className="stock-preview__meta">
                <span
                  className={`stock-delta ${delta > 0 ? 'is-positive' : delta < 0 ? 'is-negative' : ''}`}
                >
                  {signedNumber(delta)}
                </span>
                {previewProduct ? <StockBadge product={previewProduct} /> : null}
              </div>
            </div>
          ) : null}
        </form>
      )}
    </Dialog>
  );
}
