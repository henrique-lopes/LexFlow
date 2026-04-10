<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cases', function (Blueprint $table) {
            $table->string('fee_payment_type', 20)->default('cash')->after('fee_success_pct');
            $table->decimal('fee_downpayment', 15, 2)->nullable()->after('fee_payment_type');
            $table->json('fee_installments')->nullable()->after('fee_downpayment');
        });
    }

    public function down(): void
    {
        Schema::table('cases', function (Blueprint $table) {
            $table->dropColumn(['fee_payment_type', 'fee_downpayment', 'fee_installments']);
        });
    }
};
