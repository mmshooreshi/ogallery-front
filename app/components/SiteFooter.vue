<!-- app/components/SiteFooter.vue -->
<template>
    <!-- FOOTER -->
    <footer class="foot flex flex-col sm:flex-row ">
        <div class="link">COPYRIGHT © {{ new Date().getFullYear() }} OGALLERY</div>
        <NuxtLink to="/mailing-list" class="link">JOIN OUR MAILING LIST</NuxtLink>
        <NuxtLink to="/cookies" class="link">MANAGE COOKIES</NuxtLink>
    </footer>

</template>

<script setup lang="ts">
</script>

<style scoped>

/* Footer */
.foot {
  /* margin-top: 24px;  */
  /* border-top:1px solid rgba(0,0,0,.08); */
  margin-top: 8px;
  /* padding: 28px 12px 40px; text-align:center; */
  padding-bottom: 8px;
  color:#666; 
  
  justify-content:space-between; align-items :center;
  width: min-content; text-wrap: nowrap; gap: 24px;
  margin-inline: auto; 

  /* display: inline-block; */
    /* align-items: center; */
    direction: ltr;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    font-size: .8rem;
    color: var(--bs-dark) !important;
    font-family: dosis;
    font-weight: 400;
    text-decoration: none;
}
.foot .link { display:block; margin-bottom:16px;  color:#666;  text-decoration: none; }

</style>





