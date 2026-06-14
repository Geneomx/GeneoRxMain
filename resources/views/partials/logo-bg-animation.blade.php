{{-- Subtle animated GeneoRx logo watermark — fixed behind page content --}}
<div class="geneorx-bg" aria-hidden="true">
  <div class="geneorx-bg__ambient"></div>
  <div class="geneorx-bg__orbits"></div>
  <div class="geneorx-bg__logo geneorx-bg__logo--primary" style="--logo-url: url('{{ \App\Support\LogoAssets::mark() }}')"></div>
  <div class="geneorx-bg__logo geneorx-bg__logo--secondary" style="--logo-url: url('{{ \App\Support\LogoAssets::mark() }}')"></div>
</div>
