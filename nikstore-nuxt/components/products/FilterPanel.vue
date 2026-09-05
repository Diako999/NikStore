<template>
  <Teleport to="body">
    <Transition name="fp-fade">
      <div v-if="open" class="fp-backdrop" @click.self="close">
        <Transition name="fp-slide" appear>
          <div class="fp-sheet">
            <div class="fp-sheet__handle" />
            <div class="fp-sheet__head">
              <h2>فیلترها</h2>
              <button type="button" class="fp-close" aria-label="بستن" @click="close">
                <AppIcon name="close" :size="16" :stroke-width="2" />
              </button>
            </div>

            <div class="fp-sheet__body">
              <section v-if="brands.length" class="fp-section">
                <h3>برند</h3>
                <div class="fp-chips">
                  <button
                    type="button"
                    class="fp-chip"
                    :class="{ 'fp-chip--active': local.brand === null }"
                    @click="local.brand = null"
                  >
                    همه
                  </button>
                  <button
                    v-for="b in brands"
                    :key="b._id"
                    type="button"
                    class="fp-chip"
                    :class="{ 'fp-chip--active': local.brand === b._id }"
                    @click="local.brand = local.brand === b._id ? null : b._id"
                  >
                    {{ b.name }}
                  </button>
                </div>
              </section>

              <section class="fp-section">
                <h3>محدوده قیمت (تومان)</h3>
                <div class="fp-price-row">
                  <input v-model.number="local.minPrice" type="number" inputmode="numeric" placeholder="از">
                  <span class="fp-price-sep">تا</span>
                  <input v-model.number="local.maxPrice" type="number" inputmode="numeric" placeholder="تا">
                </div>
              </section>

              <section class="fp-section">
                <label class="fp-toggle">
                  <span>فقط کالاهای موجود</span>
                  <input v-model="local.inStock" type="checkbox">
                  <span class="fp-toggle__track"><span class="fp-toggle__thumb" /></span>
                </label>
              </section>
            </div>

            <div class="fp-sheet__footer">
              <button type="button" class="fp-btn fp-btn--ghost" @click="resetAndApply">پاک کردن</button>
              <button type="button" class="fp-btn fp-btn--primary" @click="applyAndClose">اعمال فیلتر</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { reactive, watch } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  brands: { type: Array, default: () => [] },
  filters: {
    type: Object,
    default: () => ({ brand: null, minPrice: null, maxPrice: null, inStock: false }),
  },
})

const emit = defineEmits(['update:open', 'apply', 'reset'])

const local = reactive({ ...props.filters })

watch(() => props.open, (val) => {
  if (val) Object.assign(local, props.filters)
})

function close() {
  emit('update:open', false)
}

function applyAndClose() {
  emit('apply', { ...local })
  close()
}

function resetAndApply() {
  local.brand = null
  local.minPrice = null
  local.maxPrice = null
  local.inStock = false
  emit('reset')
  close()
}
</script>

<style scoped>
.fp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0, 0, 0, .45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.fp-sheet {
  width: 100%;
  max-width: 480px;
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  padding: 10px 18px 18px;
  background: rgba(15, 22, 18, .92);
  border: 1px solid var(--glass-border);
  border-bottom: none;
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
}
[data-theme='light'] .fp-sheet {
  background: rgba(248, 246, 240, .95);
}

.fp-sheet__handle {
  width: 40px;
  height: 4px;
  border-radius: 3px;
  background: var(--glass-border);
  margin: 4px auto 12px;
}

.fp-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.fp-sheet__head h2 { font-size: 15px; font-weight: 700; color: var(--text-primary); }

.fp-close {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
}

.fp-sheet__body { overflow-y: auto; flex: 1; }

.fp-section { margin-bottom: 20px; }
.fp-section h3 { font-size: 12.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 10px; }

.fp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.fp-chip {
  font-size: 11.5px;
  font-weight: 600;
  padding: 7px 13px;
  border-radius: 999px;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
}
.fp-chip--active {
  color: #fff;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  border-color: transparent;
}

.fp-price-row { display: flex; align-items: center; gap: 10px; }
.fp-price-row input {
  flex: 1;
  min-width: 0;
  border-radius: 12px;
  padding: 11px 12px;
  font-size: 12.5px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  outline: none;
}
.fp-price-sep { font-size: 11.5px; color: var(--text-secondary); }

.fp-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--text-primary);
  font-weight: 600;
}
.fp-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.fp-toggle__track {
  position: relative;
  width: 40px;
  height: 23px;
  border-radius: 999px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  transition: background .15s ease;
}
.fp-toggle__thumb {
  position: absolute;
  top: 2px;
  inset-inline-start: 2px;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: var(--text-secondary);
  transition: inset-inline-start .15s ease, background .15s ease;
}
.fp-toggle input:checked + .fp-toggle__track { background: var(--brand); border-color: transparent; }
.fp-toggle input:checked + .fp-toggle__track .fp-toggle__thumb {
  inset-inline-start: 19px;
  background: #fff;
}

.fp-sheet__footer {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--glass-border);
}
.fp-btn {
  flex: 1;
  padding: 12px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}
.fp-btn--ghost {
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
}
.fp-btn--primary {
  color: #fff;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  box-shadow: 0 8px 20px rgba(40, 55, 46, .3);
}

.fp-fade-enter-active, .fp-fade-leave-active { transition: opacity .2s ease; }
.fp-fade-enter-from, .fp-fade-leave-to { opacity: 0; }
.fp-slide-enter-active, .fp-slide-leave-active { transition: transform .25s ease; }
.fp-slide-enter-from, .fp-slide-leave-to { transform: translateY(100%); }
</style>
