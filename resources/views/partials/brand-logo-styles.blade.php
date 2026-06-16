{{-- Shared GeneoRx full-logo sizing — include once per layout --}}
<style>
  .geneorx-brand--full { gap: 0; align-items: center; }
  .geneorx-brand-full {
    display: block;
    width: auto;
    max-width: 100%;
    object-fit: contain;
  }

  /* Nav / header bar */
  .geneorx-brand--logo-nav .geneorx-brand-full,
  .nav-brand-wrap .geneorx-brand-full,
  .auth-top .geneorx-brand-full {
    height: 52px;
    max-width: min(320px, 72vw);
  }

  /* Portal dashboard header */
  .portal-brand .geneorx-brand-full,
  .geneorx-brand--logo-portal .geneorx-brand-full {
    height: 56px;
    max-width: min(360px, 78vw);
  }

  /* Auth left hero (register, login, etc.) */
  .auth-intro .geneorx-brand-full,
  .geneorx-brand--logo-hero .geneorx-brand-full {
    height: 96px;
    max-width: min(520px, 92vw);
  }
  .auth-intro .geneorx-brand {
    margin-bottom: 24px;
  }

  /* Intro modal header */
  .intro-header .geneorx-brand {
    flex: 0 1 auto;
    min-width: 0;
    max-width: calc(100% - 112px);
    overflow: hidden;
  }
  .geneorx-brand--logo-intro .geneorx-brand-full,
  .intro-header .geneorx-brand-full {
    height: 34px;
    max-height: 34px;
    width: auto;
    max-width: min(168px, 48vw);
    object-fit: contain;
  }

  @media (max-width: 620px) {
    .geneorx-brand--logo-intro .geneorx-brand-full,
    .intro-header .geneorx-brand-full {
      height: 30px;
      max-height: 30px;
      max-width: min(148px, 44vw);
    }
  }

  .geneorx-brand-subtitle {
    margin-left: 14px;
    padding-left: 14px;
    border-left: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted, var(--text-muted, #A9B4D6));
    white-space: nowrap;
  }

  @media (max-width: 860px) {
    .auth-top .geneorx-brand-full {
      height: 46px;
      max-width: min(280px, 68vw);
    }
  }
</style>
