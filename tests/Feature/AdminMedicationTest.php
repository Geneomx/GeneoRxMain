<?php

namespace Tests\Feature;

use App\Models\Medication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The medication catalog form gained an "also known as" (aliases) field. These
 * lock in that aliases round-trip through create and edit, since aliases drive
 * medication search matching and were previously only settable in the database.
 */
class AdminMedicationTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true, 'role' => User::ROLE_OWNER]);
    }

    public function test_creating_a_medication_saves_aliases(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.medications.store'), [
                'name' => 'Metformin',
                'slug' => 'metformin',
                'symptom_chips' => "Fatigue\nBrain fog",
                'aliases' => "Glucophage\nFortamet\n\n  Riomet  ",
            ])->assertRedirect(route('admin.medications'));

        $med = Medication::where('slug', 'metformin')->sole();

        // Blank lines dropped, surrounding whitespace trimmed.
        $this->assertSame(['Glucophage', 'Fortamet', 'Riomet'], $med->aliases);
        $this->assertSame(['Fatigue', 'Brain fog'], $med->symptom_chips);
    }

    public function test_editing_a_medication_updates_aliases(): void
    {
        $med = Medication::create([
            'name' => 'Omeprazole',
            'slug' => 'omeprazole',
            'aliases' => ['Prilosec'],
            'is_active' => true,
        ]);

        $this->actingAs($this->admin())
            ->put(route('admin.medications.update', $med), [
                'name' => 'Omeprazole',
                'slug' => 'omeprazole',
                'aliases' => "Prilosec\nLosec",
            ])->assertRedirect(route('admin.medications'));

        $this->assertSame(['Prilosec', 'Losec'], $med->fresh()->aliases);
    }

    public function test_aliases_reach_the_frontend_catalog(): void
    {
        Medication::create([
            'name' => 'Metformin',
            'slug' => 'metformin',
            'aliases' => ['Glucophage'],
            'is_active' => true,
        ]);

        $entry = collect(Medication::toMedDb())->firstWhere('id', 'metformin');

        $this->assertSame(['Glucophage'], $entry['aliases']);
    }

    public function test_support_role_cannot_create_medications(): void
    {
        $support = User::factory()->create(['is_admin' => true, 'role' => User::ROLE_SUPPORT]);

        $this->actingAs($support)
            ->post(route('admin.medications.store'), [
                'name' => 'Test',
                'slug' => 'test',
            ])->assertForbidden();

        $this->assertDatabaseMissing('medications', ['slug' => 'test']);
    }
}
