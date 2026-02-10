<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth', layout: 'admin' })

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
// const toast = useToast() // Assuming you have a toast/alert system

// --- State ---
const isNew = route.params.id === 'new'
const id = isNew ? null : Number(route.params.id)
const saving = ref(false)
const activeTab = ref<'EN' | 'FA'>('EN')

// Default Form State matching your JSON structure exactly
const form = reactive({
  kind: 'ARTIST', // Default to Artist
  slug: '',
  status: 'DRAFT',
  locales: {
    EN: { title: '', summary: '', bodyHtml: '' },
    FA: { title: '', summary: '', bodyHtml: '' }
  }
})

// --- Data Fetching ---
if (!isNew) {
  const { data } = await useFetch(`/api/admin/entries/${id}`)
  if (data.value) {
    // Map API response back to Form
    form.kind = data.value.kind
    form.slug = data.value.slug
    form.status = data.value.status
    
    // The API sends locales as an Object { EN: {...}, FA: {...} } (see API code below)
    if (data.value.locales) {
      if (data.value.locales.EN) Object.assign(form.locales.EN, data.value.locales.EN)
      if (data.value.locales.FA) Object.assign(form.locales.FA, data.value.locales.FA)
    }
  }
}

// --- Auto-Slug Logic ---
// Only auto-generate slug if it's a NEW entry and slug is empty
watch(() => form.locales.EN.title, (newVal) => {
  if (isNew && newVal && !form.slug) {
    form.slug = newVal.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
      .replace(/^-+|-+$/g, '')     // Trim hyphens
  }
})

// --- Save Action ---
async function save() {
  if (!form.slug) return alert("Slug is required")
  
  saving.value = true
  try {
    const method = isNew ? 'POST' : 'PUT'
    const url = isNew ? '/api/admin/entries' : `/api/admin/entries/${id}`
    
    await $fetch(url, {
      method,
      body: {
        kind: form.kind,
        slug: form.slug,
        status: form.status,
        locales: form.locales // Send the full object
      }
    })
    
    router.push('/admin/artists')
  } catch (error: any) {
    console.error(error)
    alert(error.statusMessage || 'Error saving artist')
  } finally {
    saving.value = false
  }
}




/* ======= Toasts ======= */
const toasts = ref<{id:number; msg:string; color:'gray'|'green'|'red'}[]>([])
function toast(msg:string, color:'gray'|'green'|'red'='gray'){ const id=Date.now()+Math.random(); toasts.value.push({id,msg,color}); setTimeout(()=>toasts.value = toasts.value.filter(t=>t.id!==id), 2200) }

async function actionUploadToBucket(f:any) {
  await $fetch('/api/media/fix', {
    method:'POST',
    body:{ action:'uploadToBucket', key:f.key },
    credentials:'include'
  })
  toast('Uploaded to bucket','green')
}
</script>

<template>
  <div class="max-w-5xl mx-auto pb-20">
    
    <div class="flex items-center justify-between mb-8 sticky top-0 bg-[#f8f9fa] z-10 py-4 border-b border-gray-200/50 backdrop-blur-sm">
      <div class="flex items-center gap-4">
        <NuxtLink to="/admin/artists" class="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500">
          <Icon name="ph:arrow-left" class="text-xl" />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isNew ? (locale === 'FA' ? 'افزودن هنرمند' : 'New Artist') : form.locales.EN.title || 'Untitled' }}
          </h1>
          <div class="text-xs text-gray-500 font-mono mt-1" v-if="!isNew">ID: {{ id }}</div>
        </div>
      </div>

      <div class="flex gap-3">
        <button 
          @click="save" 
          :disabled="saving"
          class="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-black/10"
        >
          <Icon v-if="saving" name="ph:spinner" class="animate-spin text-lg" />
          <Icon v-else name="ph:check-bold" class="text-lg" />
          {{ locale === 'FA' ? 'ذخیره تغییرات' : 'Save Changes' }}
        </button>
      </div>
    </div>
    <!-- {{ form }} -->

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <div class="lg:col-span-8 space-y-6">
        
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="flex border-b border-gray-200">
            <button 
              @click="activeTab = 'EN'" 
              class="border-transparent  flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2"
              :class="activeTab === 'EN' ? 'text-black bg-yellow-50/50' : 'text-gray-500 hover:bg-gray-50'"
            >
              EN
            </button>
            <button 
              @click="activeTab = 'FA'" 
              class="border-transparent  flex-1 py-3 text-sm font-bold border-b-2 transition-colors font-persian flex items-center justify-center gap-2"
              :class="activeTab === 'FA' ? 'text-black bg-yellow-50/50' : 'text-gray-500 hover:bg-gray-50'"
            >
              FA
            </button>
          </div>

          <div class="p-6 md:p-8">
            <div v-if="activeTab === 'EN'" class="space-y-6 animate-fade-in">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Artist Name</label>
                <input 
                  v-model="form.locales.EN.title" 
                  class="w-[95%] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ffde00] outline-none transition-shadow text-lg font-medium" 
                  placeholder="e.g. Donya Aalipour" 
                />
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Summary <span class="text-gray-400 font-normal">(Optional, SEO)</span></label>
                <textarea 
                  v-model="form.locales.EN.summary" 
                  rows="3" 
                  class="w-[95%] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ffde00] outline-none transition-shadow text-sm"
                  placeholder="Short description for lists and SEO..."
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Biography (HTML)</label>
                <div class="relative">
                  <textarea 
                    v-model="form.locales.EN.bodyHtml" 
                    rows="15" 
                    class="w-[95%] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ffde00] outline-none transition-shadow font-mono text-sm leading-relaxed bg-gray-50"
                    placeholder="<p>Enter biography here...</p>"
                  ></textarea>
                  <div class="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">HTML Mode</div>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'FA'" class="space-y-6 animate-fade-in" dir="rtl">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2 font-persian">نام هنرمند</label>
                <input 
                  v-model="form.locales.FA.title" 
                  class="w-[95%] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ffde00] outline-none transition-shadow text-lg font-medium font-persian" 
                  placeholder="مثال: دنیا عالی‌پور" 
                />
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2 font-persian">خلاصه <span class="text-gray-400 font-normal">(اختیاری)</span></label>
                <textarea 
                  v-model="form.locales.FA.summary" 
                  rows="3" 
                  class="w-[95%] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ffde00] outline-none transition-shadow text-sm font-persian"
                  placeholder="توضیحات کوتاه..."
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2 font-persian">بیوگرافی (HTML)</label>
                <div class="relative">
                  <textarea 
                    v-model="form.locales.FA.bodyHtml" 
                    rows="15" 
                    class="w-[95%] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ffde00] outline-none transition-shadow font-mono text-sm leading-relaxed bg-gray-50 text-right"
                    placeholder="<p>متن بیوگرافی...</p>"
                  ></textarea>
                  <div class="absolute bottom-2 left-2 text-xs text-gray-400 pointer-events-none">HTML Mode</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-4 space-y-6">
        
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 class="font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
            <Icon name="ph:gear" /> Settings
          </h3>

          <div class="mb-5">
            <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Publish Status</label>
            <div class="relative">
              <select v-model="form.status" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none appearance-none cursor-pointer hover:border-gray-300 transition-colors">
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <Icon name="ph:caret-down" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div class="mt-2 text-xs flex items-center gap-1.5" :class="{
              'text-green-600': form.status === 'PUBLISHED',
              'text-amber-600': form.status === 'DRAFT',
              'text-gray-600': form.status === 'ARCHIVED'
            }">
              <span class="w-2 h-2 rounded-full" :class="{
                'bg-green-500': form.status === 'PUBLISHED',
                'bg-amber-500': form.status === 'DRAFT',
                'bg-gray-500': form.status === 'ARCHIVED'
              }"></span>
              Current: {{ form.status }}
            </div>
          </div>

          <div class="mb-5">
            <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Entry Type</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                type="button"
                @click="form.kind = 'ARTIST'"
                class="p-2 text-xs font-bold border rounded-lg transition-all"
                :class="form.kind === 'ARTIST' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'"
              >
                Artist
              </button>
              <button 
                type="button"
                @click="form.kind = 'EXHIBITED-ARTIST'"
                class="p-2 text-xs font-bold border rounded-lg transition-all"
                :class="form.kind === 'EXHIBITED-ARTIST' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'"
              >
                Exhibited
              </button>
            </div>
          </div>

          <div>
            
            <label class="block text-xs font-bold text-gray-500 uppercase mb-2">URL Slug</label>
            <input 
              v-model="form.slug" 
              class="w-[95%] p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none font-mono text-xs text-gray-600" 
            />
            <p class="text-[10px] text-gray-400 mt-1 truncate">
              Preview: /artists/{{ form.slug }}
            </p>
          </div>
        </div>

        <div v-if="!isNew" class="bg-gray-50 p-5 rounded-xl border border-gray-200 text-xs text-gray-500 space-y-2">
          <div class="flex justify-between">
            <span>Created:</span>
            <span class="font-mono">2024-01-01</span>
          </div>
          <div class="flex justify-between">
            <span>Updated:</span>
            <span class="font-mono">Today</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Simple fade in animation for tab switching */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>