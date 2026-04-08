<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE workspaces MODIFY COLUMN plan ENUM(
            'trial','starter','pro','premium',
            'solo_trial','solo_starter','solo_pro'
        ) NOT NULL DEFAULT 'trial'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE workspaces MODIFY COLUMN plan ENUM(
            'trial','starter','pro','premium'
        ) NOT NULL DEFAULT 'trial'");
    }
};
