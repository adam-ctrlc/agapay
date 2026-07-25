<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Signing in is deliberately still allowed while a merchant waits, so they can
 * see where their application stands. This only blocks the actions that move
 * real goods.
 */
final class EnsureApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && ! $user->isApproved()) {
            abort(
                Response::HTTP_FORBIDDEN,
                'Your store is still waiting for LGU approval.',
            );
        }

        return $next($request);
    }
}
