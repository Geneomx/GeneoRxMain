<?php

// `enabled` gates a language out of the user-facing pickers on BOTH platforms
// until its translation is actually complete. ar/ur/sw are ~2% translated
// (engine output is 0% translated), so a user picking one gets a mostly-English
// UI that reads as abandoned. Flip these back to true per language once its
// pack — including the engine.* keys in portal_translations.php — is done.
return [
    ['code' => 'en', 'label' => 'English', 'native_label' => 'English', 'web_path' => '', 'enabled' => true],
    ['code' => 'es', 'label' => 'Spanish', 'native_label' => 'Español', 'web_path' => '/es', 'enabled' => true],
    ['code' => 'fr', 'label' => 'French', 'native_label' => 'Français', 'web_path' => '/fr', 'enabled' => true],
    ['code' => 'ar', 'label' => 'Arabic', 'native_label' => 'العربية', 'web_path' => '/ar', 'enabled' => false],
    ['code' => 'ur', 'label' => 'Urdu', 'native_label' => 'اردو', 'web_path' => '/ur', 'enabled' => false],
    ['code' => 'sw', 'label' => 'Swahili', 'native_label' => 'Kiswahili', 'web_path' => '/sw', 'enabled' => false],
];
