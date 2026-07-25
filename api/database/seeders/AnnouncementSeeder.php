<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AnnouncementCategory;
use App\Models\Announcement;
use App\Models\User;
use Illuminate\Database\Seeder;

final class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $mayor = User::query()->where('email', 'mayor@agapay.test')->first();
        $merchant = User::query()->where('email', 'merchant@agapay.test')->first();

        $samples = [
            [
                'author' => $mayor,
                'category' => AnnouncementCategory::Relief->value,
                'title' => 'Kadiwa pop-up this Saturday',
                'body' => 'The Kadiwa ng Pangulo pop-up store will have 500 sacks of subsidized rice this Saturday, 7 AM at Barangay 176. Reserve through AyudaLock before you travel.',
            ],
            [
                'author' => $mayor,
                'category' => AnnouncementCategory::Advisory->value,
                'title' => 'Rotational brownout schedule',
                'body' => 'Expect a 2-hour rotational brownout from 1 PM to 3 PM today. Merchant scanners will keep working offline, so relief claims continue as normal.',
            ],
            [
                'author' => $merchant,
                'category' => AnnouncementCategory::General->value,
                'title' => 'New claiming hours',
                'body' => 'Our store now accepts relief claims from 6 AM to 6 PM daily. Bring your QR code or SMS code from the app.',
            ],
        ];

        foreach ($samples as $sample) {
            if ($sample['author'] === null) {
                continue;
            }

            Announcement::query()->create([
                'author_id' => $sample['author']->id,
                'title' => $sample['title'],
                'body' => $sample['body'],
                'category' => $sample['category'],
            ]);
        }
    }
}
