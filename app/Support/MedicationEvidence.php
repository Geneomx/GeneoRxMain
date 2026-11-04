<?php

namespace App\Support;

class MedicationEvidence
{
    public const MAGNESIUM_SOURCE = 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/';

    /** Correct the unrelated chemistry citation in old seeded or cached catalogs. */
    public static function correct(array $claims): array
    {
        return array_map(function ($claim) {
            if (! is_array($claim) || ! in_array('PMID:22392879', $claim['citations'] ?? [], true)) {
                return $claim;
            }
            $claim['citations'] = array_values(array_unique(array_map(
                fn ($citation) => $citation === 'PMID:22392879' ? self::MAGNESIUM_SOURCE : $citation,
                $claim['citations']
            )));
            $claim['notes'] = ['Prolonged PPI use can cause low magnesium. This general association does not establish a deficiency in an individual.'];

            return $claim;
        }, $claims);
    }
}
