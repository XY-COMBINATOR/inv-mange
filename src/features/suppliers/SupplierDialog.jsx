import { useEffect, useId, useState } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';

const EMPTY_VALUES = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  leadTime: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SupplierDialog({ open, onClose, supplier = null }) {
  const { addSupplier, updateSupplier } = useStore();
  const { showToast } = useToast();
  const formId = useId();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      supplier
        ? {
            name: supplier.name,
            contactName: supplier.contactName || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            leadTime: String(supplier.leadTime ?? ''),
          }
        : EMPTY_VALUES,
    );
  }, [open, supplier]);

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = 'Enter a supplier name.';
    if (
      values.email.trim() &&
      !EMAIL_PATTERN.test(values.email.trim())
    ) {
      next.email = 'Enter a valid email address.';
    }
    if (
      values.leadTime !== '' &&
      (!Number.isInteger(Number(values.leadTime)) ||
        Number(values.leadTime) < 0)
    ) {
      next.leadTime = 'Enter a whole number of days.';
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    if (supplier) {
      updateSupplier(supplier.id, values);
      showToast(`${values.name.trim()} updated.`);
    } else {
      addSupplier(values);
      showToast(`${values.name.trim()} added.`);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={supplier ? 'Edit supplier' : 'Add supplier'}
      description="Keep contact details and lead times close to your inventory."
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} icon="check">
            {supplier ? 'Save changes' : 'Add supplier'}
          </Button>
        </>
      }
    >
      <form id={formId} className="form-grid" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Supplier name"
          value={values.name}
          onChange={setField('name')}
          error={errors.name}
          required
          autoComplete="organization"
          data-autofocus
          className="form-grid__full"
          maxLength={80}
        />
        <TextField
          label="Contact person"
          value={values.contactName}
          onChange={setField('contactName')}
          autoComplete="name"
          maxLength={80}
        />
        <TextField
          label="Lead time (days)"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={values.leadTime}
          onChange={setField('leadTime')}
          error={errors.leadTime}
          supportingText="Typical days from order to delivery."
        />
        <TextField
          label="Email"
          type="email"
          value={values.email}
          onChange={setField('email')}
          error={errors.email}
          autoComplete="email"
          maxLength={120}
        />
        <TextField
          label="Phone"
          type="tel"
          value={values.phone}
          onChange={setField('phone')}
          autoComplete="tel"
          maxLength={24}
        />
      </form>
    </Dialog>
  );
}
