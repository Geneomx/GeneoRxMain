<?php

namespace Database\Seeders;

use App\Models\Medication;
use Illuminate\Database\Seeder;

class MedicationSeeder extends Seeder
{
    public function run(): void
    {
        $medications = [
            ['slug' => 'metformin',            'name' => 'Metformin',                      'sort_order' => 1,
             'symptom_chips' => ['Fatigue','Tingling hands/feet','Brain fog','Low mood','GI discomfort'],
             'claims' => [['nutrient'=>'Vitamin B12','source_quality'=>'High','citations'=>['PMID:26900641'],'notes'=>['Long-term metformin is associated with B12 deficiency risk; consider monitoring if symptoms present.']]]],

            ['slug' => 'atorvastatin',          'name' => 'Atorvastatin (statin)',           'sort_order' => 2,
             'symptom_chips' => ['Muscle aches','Fatigue','Brain fog','Sleep changes'],
             'claims' => [['nutrient'=>'CoQ10','source_quality'=>'Moderate','citations'=>['PMID:26192349'],'notes'=>['Statins are associated with lower CoQ10 levels; symptom benefit from supplementation varies.']]]],

            ['slug' => 'rosuvastatin',          'name' => 'Rosuvastatin (statin)',           'sort_order' => 3,
             'symptom_chips' => ['Muscle aches','Fatigue','Brain fog','Sleep changes'],
             'claims' => [['nutrient'=>'CoQ10','source_quality'=>'Moderate','citations'=>['PMID:26192349'],'notes'=>['Statins inhibit CoQ10 synthesis via the mevalonate pathway; monitoring is reasonable with myopathy symptoms.']]]],

            ['slug' => 'simvastatin',           'name' => 'Simvastatin (statin)',            'sort_order' => 4,
             'symptom_chips' => ['Muscle aches','Fatigue','Brain fog','Sleep changes'],
             'claims' => [['nutrient'=>'CoQ10','source_quality'=>'Moderate','citations'=>['PMID:26192349'],'notes'=>['Higher-potency statin; CoQ10 depletion via mevalonate pathway.']]]],

            ['slug' => 'omeprazole',            'name' => 'Omeprazole (PPI)',                'sort_order' => 5,
             'symptom_chips' => ['GI discomfort','Fatigue','Dizziness','Muscle cramps','Brain fog'],
             'claims' => [
                ['nutrient'=>'Magnesium','source_quality'=>'High','citations'=>['PMID:22392879'],'notes'=>['Long-term PPI use has a hypomagnesemia safety signal.']],
                ['nutrient'=>'Vitamin B12','source_quality'=>'Moderate','citations'=>['PMCID:PMC4110863'],'notes'=>['Reduced gastric acid may impair B12 absorption over time.']],
             ]],

            ['slug' => 'pantoprazole',          'name' => 'Pantoprazole (PPI)',              'sort_order' => 6,
             'symptom_chips' => ['GI discomfort','Fatigue','Dizziness','Muscle cramps'],
             'claims' => [
                ['nutrient'=>'Magnesium','source_quality'=>'High','citations'=>['PMID:22392879'],'notes'=>['Class effect: long-term PPI use reduces gastric acid needed for Mg absorption.']],
                ['nutrient'=>'Vitamin B12','source_quality'=>'Moderate','citations'=>['PMCID:PMC4110863'],'notes'=>['Reduced gastric acid may impair B12 release from dietary protein over time.']],
             ]],

            ['slug' => 'semaglutide',           'name' => 'Semaglutide (GLP-1)',             'sort_order' => 7,
             'symptom_chips' => ['GI discomfort','Nausea','Constipation','Fatigue','Hair loss'],
             'claims' => [
                ['nutrient'=>'Vitamin D','source_quality'=>'Moderate','citations'=>['PMID:37596620'],'notes'=>['Significant weight loss alters Vitamin D distribution.']],
                ['nutrient'=>'Zinc','source_quality'=>'Low','citations'=>['PMID:35970808'],'notes'=>['Reduced caloric intake may affect zinc status.']],
                ['nutrient'=>'Vitamin B12','source_quality'=>'Low','citations'=>['PMID:36941988'],'notes'=>['Slowed gastric motility may impair B12 absorption.']],
             ]],

            ['slug' => 'tirzepatide',           'name' => 'Tirzepatide (GIP/GLP-1)',         'sort_order' => 8,
             'symptom_chips' => ['GI discomfort','Nausea','Constipation','Fatigue','Hair loss'],
             'claims' => [
                ['nutrient'=>'Vitamin D','source_quality'=>'Moderate','citations'=>['PMID:37596620'],'notes'=>['Rapid weight loss can alter fat-soluble vitamin distribution.']],
                ['nutrient'=>'Zinc','source_quality'=>'Low','citations'=>['PMID:35970808'],'notes'=>['Reduced food intake may decrease dietary zinc.']],
                ['nutrient'=>'Vitamin B12','source_quality'=>'Low','citations'=>['PMID:36941988'],'notes'=>['GI motility changes may reduce B12 absorption.']],
             ]],

            ['slug' => 'liraglutide',           'name' => 'Liraglutide (GLP-1)',             'sort_order' => 9,
             'symptom_chips' => ['GI discomfort','Nausea','Constipation','Fatigue'],
             'claims' => [
                ['nutrient'=>'Vitamin D','source_quality'=>'Moderate','citations'=>['PMID:37596620'],'notes'=>['Weight loss affects fat-soluble vitamin status.']],
                ['nutrient'=>'Zinc','source_quality'=>'Low','citations'=>['PMID:35970808'],'notes'=>['Appetite suppression may lower zinc intake.']],
             ]],

            ['slug' => 'dulaglutide',           'name' => 'Dulaglutide (GLP-1)',             'sort_order' => 10,
             'symptom_chips' => ['GI discomfort','Nausea','Constipation','Fatigue'],
             'claims' => [
                ['nutrient'=>'Vitamin D','source_quality'=>'Moderate','citations'=>['PMID:37596620'],'notes'=>['GLP-1 class effect on fat-soluble vitamins.']],
                ['nutrient'=>'Vitamin B12','source_quality'=>'Low','citations'=>['PMID:36941988'],'notes'=>['Reduced intake may modestly impact B12.']],
             ]],

            ['slug' => 'lisinopril',            'name' => 'Lisinopril (ACE inhibitor)',       'sort_order' => 11,
             'symptom_chips' => ['Dizziness','Fatigue','Muscle cramps'],
             'claims' => [['nutrient'=>'Zinc','source_quality'=>'Moderate','citations'=>['PMID:9550460'],'notes'=>['ACE inhibitors contain zinc-binding moieties; long-term use may reduce serum zinc.']]]],

            ['slug' => 'enalapril',             'name' => 'Enalapril (ACE inhibitor)',        'sort_order' => 12,
             'symptom_chips' => ['Dizziness','Fatigue','Muscle cramps'],
             'claims' => [['nutrient'=>'Zinc','source_quality'=>'Moderate','citations'=>['PMID:9550460'],'notes'=>['ACE inhibitors have zinc-chelating properties.']]]],

            ['slug' => 'losartan',              'name' => 'Losartan (ARB)',                   'sort_order' => 13,
             'symptom_chips' => ['Dizziness','Fatigue','Muscle cramps'],
             'claims' => [['nutrient'=>'Zinc','source_quality'=>'Low','citations'=>['PMID:9550460'],'notes'=>['ARBs may share a modest zinc-lowering class effect.']]]],

            ['slug' => 'amlodipine',            'name' => 'Amlodipine (CCB)',                 'sort_order' => 14,
             'symptom_chips' => ['Swelling','Dizziness','Fatigue'],
             'claims' => [['nutrient'=>'CoQ10','source_quality'=>'Low','citations'=>['PMID:15003176'],'notes'=>['Observational data suggest cardiovascular medications may be associated with lower CoQ10.']]]],

            ['slug' => 'metoprolol',            'name' => 'Metoprolol (beta blocker)',        'sort_order' => 15,
             'symptom_chips' => ['Fatigue','Dizziness','Low energy','Sleep changes'],
             'claims' => [
                ['nutrient'=>'CoQ10','source_quality'=>'Low','citations'=>['PMID:15003176'],'notes'=>['Beta-blockers observed to reduce CoQ10 in some heart failure patients.']],
                ['nutrient'=>'Melatonin','source_quality'=>'Low','citations'=>['PMID:9590511'],'notes'=>['Metoprolol may suppress melatonin synthesis, contributing to sleep disturbances.']],
             ]],

            ['slug' => 'levothyroxine',         'name' => 'Levothyroxine (thyroid)',          'sort_order' => 16,
             'symptom_chips' => ['Fatigue','Brain fog','Muscle aches','Dizziness','Hair loss','Low energy'],
             'claims' => [
                ['nutrient'=>'Selenium','source_quality'=>'Moderate','citations'=>['PMID:28642112'],'notes'=>['Selenium is required for T4→T3 conversion.']],
                ['nutrient'=>'Iron','source_quality'=>'Moderate','citations'=>['PMID:16001874'],'notes'=>['Iron deficiency can blunt levothyroxine response.']],
                ['nutrient'=>'Zinc','source_quality'=>'Moderate','citations'=>['PMID:24861516'],'notes'=>['Zinc is involved in thyroid hormone metabolism.']],
             ]],

            ['slug' => 'furosemide',            'name' => 'Furosemide (loop diuretic)',       'sort_order' => 17,
             'symptom_chips' => ['Muscle cramps','Dizziness','Fatigue','Heart palpitations','Low energy'],
             'claims' => [
                ['nutrient'=>'Potassium','source_quality'=>'High','citations'=>['PMID:17536977'],'notes'=>['Loop diuretics cause significant urinary potassium wasting.']],
                ['nutrient'=>'Magnesium','source_quality'=>'High','citations'=>['PMID:17536977'],'notes'=>['Furosemide increases urinary magnesium excretion.']],
                ['nutrient'=>'Calcium','source_quality'=>'Moderate','citations'=>['PMID:17536977'],'notes'=>['Loop diuretics increase urinary calcium excretion.']],
                ['nutrient'=>'B vitamins','source_quality'=>'Low','citations'=>['PMID:22716193'],'notes'=>['Chronic use may lower B1 (thiamine) levels.']],
             ]],

            ['slug' => 'hydrochlorothiazide',   'name' => 'Hydrochlorothiazide (HCTZ)',       'sort_order' => 18,
             'symptom_chips' => ['Muscle cramps','Dizziness','Fatigue','Heart palpitations'],
             'claims' => [
                ['nutrient'=>'Potassium','source_quality'=>'High','citations'=>['PMID:17536977'],'notes'=>['Thiazide diuretics cause potassium wasting.']],
                ['nutrient'=>'Magnesium','source_quality'=>'High','citations'=>['PMID:17536977'],'notes'=>['Thiazides increase renal magnesium excretion.']],
                ['nutrient'=>'Zinc','source_quality'=>'Moderate','citations'=>['PMID:9550460'],'notes'=>['Thiazide diuretics may increase urinary zinc loss.']],
             ]],

            ['slug' => 'spironolactone',        'name' => 'Spironolactone (K-sparing diuretic)', 'sort_order' => 19,
             'symptom_chips' => ['Dizziness','Fatigue','Muscle cramps'],
             'claims' => [
                ['nutrient'=>'Potassium','source_quality'=>'High','citations'=>['PMID:17536977'],'notes'=>['Spironolactone retains potassium; hyperkalemia monitoring required.']],
                ['nutrient'=>'Magnesium','source_quality'=>'Moderate','citations'=>['PMID:17536977'],'notes'=>['Potassium-sparing diuretics also conserve magnesium.']],
             ]],

            ['slug' => 'warfarin',              'name' => 'Warfarin (anticoagulant)',         'sort_order' => 20,
             'symptom_chips' => ['Fatigue','Dizziness','Brain fog'],
             'claims' => [['nutrient'=>'Vitamin K','source_quality'=>'High','citations'=>['PMID:25851918'],'notes'=>['Warfarin blocks Vitamin K recycling. Consistent Vitamin K intake is key  abrupt changes alter INR.']]]],
        ];

        foreach ($medications as $data) {
            Medication::updateOrCreate(
                ['slug' => $data['slug']],
                array_merge($data, ['is_active' => true])
            );
        }
    }
}
