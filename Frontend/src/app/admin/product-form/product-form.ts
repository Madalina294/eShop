import { FormBuilder, Validators } from '@angular/forms';

/**
 * The product form is identical between "add" and "edit" apart from the id and
 * whether an image is mandatory, so its shape and its FormData serialisation
 * live here instead of being written out twice.
 */
export function buildProductForm(fb: FormBuilder) {
  return fb.nonNullable.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    description: ['', Validators.required],
    color: ['', Validators.required],
    dimensions: ['', Validators.required],
    material: ['', Validators.required],
    weight: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0)]],
    categoryId: [0, [Validators.required, Validators.min(1)]],
  });
}

export type ProductFormValue = ReturnType<typeof buildProductForm>['value'];

/** Serialises the form (plus an optional image) the way the endpoints expect. */
export function toProductFormData(
  values: Record<string, unknown>,
  image: File | null,
  id?: number
): FormData {
  const data = new FormData();

  if (id != null) data.append('id', String(id));

  for (const key of [
    'name',
    'price',
    'description',
    'color',
    'dimensions',
    'material',
    'weight',
    'quantity',
    'categoryId',
  ]) {
    data.append(key, String(values[key] ?? ''));
  }

  if (image) data.append('image', image, image.name);

  return data;
}
