<?php

use App\Models\Announcement;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/a/{announcement}', function (Announcement $announcement) {
    return view('announcement', [
        'deepLink' => 'agapay://announcements',
    ]);
})->name('announcements.show');
