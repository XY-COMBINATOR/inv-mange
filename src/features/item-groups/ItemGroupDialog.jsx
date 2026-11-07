import { useEffect, useId, useState } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Icon } from '../../components/ui/Icon';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';

const SWATCH_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

const EMPTY_VALUES = {
  name: '',
  code: '',
  description: '',
  color: '#3b82f6',
};

export function ItemGroupDialog({ open, onClose, group = null }) {
  const { itemGroups, addItemGroup, updateItemGroup } = useStore();
  const { showToast } = useToast();
  const formId = useId();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (group) {
      setValues({
        name: group.name,
        code: group.code,
        description: group.description || '',
        color: group.color || '#3b82f6',
      });
    } else {
      setValues(EMPTY_VALUES);
    }
  }, [open, group]);

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate code proposal for new groups if code not modified
      if (field === 'name' && !group && (!prev.code || prev.code === prev.name.slice(0, 4).toUpperCase())) {
        next.code = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.name.trim()) {
      nextErrors.name = 'Enter an item group name.';
    } else {
      const dupName = itemGroups.some(
        (g) =>
          g.name.trim().toLowerCase() === values.name.trim().toLowerCase() &&
          g.id !== group?.id
      );
      if (dupName) nextErrors.name = 'An item group with this name already exists.';
    }

    if (!values.code.trim()) {
      nextErrors.code = 'Enter a unique group code.';
    } else {
      const dupCode = itemGroups.some(
        (g) =>
          g.code.trim().toUpperCase() === values.code.trim().toUpperCase() &&
          g.id !== group?.id
      );
      if (dupCode) nextErrors.code = 'This code is already assigned to another group.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate() || saving) return;

    setSaving(true);
    try {
      if (group) {
        await updateItemGroup(group.id, values);
        showToast(`Item group "${values.name.trim()}" updated.`);
      } else {
        await addItemGroup(values);
        showToast(`Item group "${values.name.trim()}" created.`);
      }
      onClose();
    } catch {
      showToast('Error saving item group.', { error: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={group ? 'Edit Item Group' : 'New Item Group'}
      headline={
        group ? 'Edit Group Specifications' : 'Create Item Group'
      }
      actions={
        <>
          <Button variant="text" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={saving}
            icon={saving ? undefined : 'check'}
          >
            {saving ? 'Saving...' : group ? 'Save changes' : 'Create group'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="form-grid" noValidate>
        <TextField
          label="Group Name"
          value={values.name}
          onChange={setField('name')}
          error={errors.name}
          helperText="e.g., Electronics, Audio Gear, Raw Materials"
          required
          autoFocus
        />

        <TextField
          label="Group Code"
          value={values.code}
          onChange={setField('code')}
          error={errors.code}
          helperText="Unique uppercase prefix code (e.g., ELEC, AUD, RAW)"
          required
        />

        <TextField
          label="Description"
          value={values.description}
          onChange={setField('description')}
          helperText="Brief details about the products belonging to this group."
        />

        <div>
          <label className="color-picker-label">Accent Color Theme</label>
          <div className="color-swatches" role="radiogroup" aria-label="Group Color">
            {SWATCH_COLORS.map((c) => {
              const selected = values.color === c;
              return (
                <button
                  type="button"
                  key={c}
                  className={`color-swatch-btn ${selected ? 'is-active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setValues((prev) => ({ ...prev, color: c }))}
                  aria-label={`Select color ${c}`}
                  aria-checked={selected}
                  role="radio"
                >
                  {selected && (
                    <Icon name="check" size={16} className="color-swatch-btn__icon" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Dialog>
  );
}

