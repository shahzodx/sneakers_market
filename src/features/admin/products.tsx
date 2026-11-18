import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ActionForm } from '@/components/action-form';
import { ImageUpload } from '@/components/image-upload';
import * as actions from '@/server/admin-actions';
import { money } from '@/lib/utils';
import type { AdminData } from '@/types/admin';
export function AdminProducts({ data, edit }: { data: AdminData; edit?: string }) {
  const { products, brands, categories } = data;
  const p = products.find((x) => x.id === edit);
  return (
    <>
      <div className="admin-product-actions">
        <Button asChild>
          <Link href="/admin?tab=products&edit=new">Добавить товар +</Link>
        </Button>
        <span>{products.length} товаров, включая архив</span>
      </div>
      {edit && (
        <section className="admin-panel">
          <h2>{p ? 'Редактировать: ' + p.name : 'Новый товар'}</h2>
          <ActionForm action={actions.saveProduct}>
            <input type="hidden" name="id" value={p?.id || ''} />
            <div className="form-grid">
              {[
                ['name', 'Название', p?.name || ''],
                ['slug', 'Slug', p?.slug || ''],
                ['price', 'Цена UZS', p?.price || ''],
                ['oldPrice', 'Старая цена', p?.oldPrice || ''],
                ['material', 'Материалы', p?.material || 'Кожа, текстиль, резина'],
              ].map(([name, label, value]) => (
                <label key={name}>
                  {label}
                  <input
                    name={String(name)}
                    defaultValue={value}
                    required={name !== 'oldPrice'}
                    type={String(name).toLowerCase().includes('price') ? 'number' : 'text'}
                  />
                </label>
              ))}
              <label>
                Бренд
                <select name="brandId" defaultValue={p?.brandId}>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Категория
                <select name="categoryId" defaultValue={p?.categoryId}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Пол
                <select name="gender" defaultValue={p?.gender || 'unisex'}>
                  <option value="unisex">Унисекс</option>
                  <option value="men">Мужские</option>
                  <option value="women">Женские</option>
                </select>
              </label>
              {!p && (
                <label>
                  URL изображения
                  <input name="image" defaultValue="/images/sneaker-white.jpg" required />
                </label>
              )}
              <label className="full-width">
                Описание
                <textarea
                  name="description"
                  defaultValue={p?.description}
                  required
                  minLength={10}
                />
              </label>
            </div>
            <div className="inline-checks">
              <label>
                <input type="checkbox" name="demo" defaultChecked={p?.demo ?? true} />
                Демонстрационный товар
              </label>
              <label>
                <input type="checkbox" name="featured" defaultChecked={p?.featured} />
                На главной
              </label>
              <label>
                <input type="checkbox" name="isNew" defaultChecked={p?.isNew} />
                Новинка
              </label>
            </div>
            <Button size="sm">Сохранить товар</Button>
          </ActionForm>
          {p && (
            <>
              <h3>Переводы товара</h3>
              {(['uz', 'en'] as const).map((locale) => {
                const tr = p.translations.find((t) => t.locale === locale);
                return (
                  <details key={locale}>
                    <summary>{locale.toUpperCase()} — описание и материалы</summary>
                    <ActionForm action={actions.saveTranslation}>
                      <input type="hidden" name="productId" value={p.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <label>
                        Название
                        <input name="name" required defaultValue={tr?.name || p.name} />
                      </label>
                      <label>
                        Описание
                        <textarea
                          name="description"
                          required
                          minLength={10}
                          defaultValue={tr?.description || ''}
                        />
                      </label>
                      <label>
                        Материалы
                        <input name="material" required defaultValue={tr?.material || ''} />
                      </label>
                      <Button size="sm">Сохранить перевод</Button>
                    </ActionForm>
                  </details>
                );
              })}
              <h3>Размеры, SKU и остатки</h3>
              <div className="variants-table">
                {p.variants.map((v) => (
                  <ActionForm key={v.id} action={actions.saveVariant}>
                    <input type="hidden" name="id" value={v.id} />
                    <input
                      type="hidden"
                      name="expectedQuantity"
                      value={v.inventory?.quantity || 0}
                    />
                    <input aria-label="SKU" name="sku" defaultValue={v.sku} required />
                    <input
                      aria-label="Размер"
                      type="number"
                      name="size"
                      defaultValue={v.size}
                      min={20}
                      max={55}
                      required
                    />
                    <input aria-label="Цвет" name="color" defaultValue={v.color} required />
                    <input
                      aria-label="HEX цвета"
                      name="colorHex"
                      type="color"
                      defaultValue={v.colorHex}
                    />
                    <input
                      aria-label="Остаток"
                      name="quantity"
                      type="number"
                      defaultValue={v.inventory?.quantity || 0}
                      min={0}
                      required
                    />
                    <Button size="sm" variant="outline">
                      Сохранить
                    </Button>
                  </ActionForm>
                ))}
              </div>
              <details>
                <summary>Добавить вариант +</summary>
                <ActionForm action={actions.addVariant}>
                  <input type="hidden" name="productId" value={p.id} />
                  <div className="form-grid">
                    {[
                      ['sku', 'SKU', ''],
                      ['size', 'EU', '42'],
                      ['color', 'Цвет', 'white'],
                      ['colorHex', 'HEX', '#eeeeee'],
                      ['quantity', 'Остаток', '0'],
                    ].map(([name, label, val]) => (
                      <label key={name}>
                        {label}
                        <input name={name} defaultValue={val} required />
                      </label>
                    ))}
                  </div>
                  <Button size="sm">Добавить вариант</Button>
                </ActionForm>
              </details>
              <h3>Изображения</h3>
              <ImageUpload productId={p.id} />
              {p.images.map((image) => (
                <div className="order-line" key={image.id}>
                  <span>
                    {image.alt} · {image.position}
                  </span>
                  <a className="text-link" href={image.url} target="_blank" rel="noreferrer">
                    Открыть ↗
                  </a>
                  <ActionForm action={actions.deleteImage}>
                    <input type="hidden" name="id" value={image.id} />
                    <Button size="sm" variant="ghost" disabled={p.images.length <= 1}>
                      Удалить
                    </Button>
                  </ActionForm>
                </div>
              ))}
              <ActionForm action={actions.addImage}>
                <input type="hidden" name="productId" value={p.id} />
                <div className="form-grid">
                  <label>
                    URL
                    <input name="url" required placeholder="https://…" />
                  </label>
                  <label>
                    Описание
                    <input name="alt" required defaultValue={p.name} />
                  </label>
                  <label>
                    Позиция
                    <input name="position" type="number" defaultValue={p.images.length} min={0} />
                  </label>
                </div>
                <Button size="sm" variant="outline">
                  Добавить по URL
                </Button>
              </ActionForm>
            </>
          )}
        </section>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Товар</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>
                    {p.brand.name} {p.name}
                  </strong>
                  <small>{p.slug}</small>
                </td>
                <td>{money(p.price)}</td>
                <td>{p.variants.reduce((a, v) => a + (v.inventory?.quantity || 0), 0)}</td>
                <td>{p.archived ? 'Архив' : 'Активен'}</td>
                <td>
                  <Link className="text-link" href={'/admin?tab=products&edit=' + p.id}>
                    Изменить ↗
                  </Link>
                  <ActionForm action={actions.archiveProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="archived" value={String(p.archived)} />
                    <Button variant="ghost" size="sm">
                      {p.archived ? 'Восстановить' : 'В архив'}
                    </Button>
                  </ActionForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="admin-panel">
        <h2>Бренды и категории</h2>
        <p className="muted">
          Бренды: {brands.map((b) => b.name).join(', ')}. Категории:{' '}
          {categories.map((c) => c.name).join(', ')}.
        </p>
        <ActionForm action={actions.saveTaxonomy}>
          <div className="form-grid">
            <label>
              Тип
              <select name="kind">
                <option value="brand">Бренд</option>
                <option value="category">Категория</option>
              </select>
            </label>
            <label>
              Название
              <input name="name" required />
            </label>
            <label>
              Slug
              <input name="slug" required pattern="[a-z0-9-]+" />
            </label>
          </div>
          <Button size="sm">Создать / обновить по slug</Button>
        </ActionForm>
      </section>
    </>
  );
}
