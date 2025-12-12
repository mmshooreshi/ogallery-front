<!-- app/pages/artists/2.[slug].vue -->
<script setup lang="ts">
import {useMultiLingual} from '~/composables/useMultiLingual'
const {t} = useMultiLingual()
const { locale } = useI18n()

</script>

<template>
    {{ t('artists.detail.tabs.selectedWorks') }}
    {{ locale }}
</template>