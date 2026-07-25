<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drops PhilSys numbers everywhere. Eligibility used to join the DSWD and
 * franchise registries to a user on that string; it now joins on a real
 * foreign key, which is a stronger link and one less identifier to hold.
 *
 * The create migrations no longer add these columns, so every drop is guarded
 * for databases built after that change.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Schema::table('franchise_holders', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        foreach (['users', 'beneficiaries', 'franchise_holders', 'blocked_claims'] as $name) {
            if (! Schema::hasColumn($name, 'phil_sys_id')) {
                continue;
            }

            Schema::table($name, function (Blueprint $table): void {
                $table->dropColumn('phil_sys_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('phil_sys_id')->nullable()->unique();
        });

        foreach (['beneficiaries', 'franchise_holders', 'blocked_claims'] as $name) {
            Schema::table($name, function (Blueprint $table): void {
                $table->string('phil_sys_id')->nullable()->index();
            });
        }

        Schema::table('franchise_holders', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('user_id');
        });

        Schema::table('beneficiaries', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
