export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/admin')) return
  const { isAuthed } = useAdminAuth()
  if (!isAuthed.value && to.path !== '/admin/login') {
    return navigateTo('/admin/login?next=' + encodeURIComponent(to.fullPath))
  }
})
