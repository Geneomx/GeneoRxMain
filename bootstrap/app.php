<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);
        $middleware->validateCsrfTokens(except: [
            'stripe/webhook',
            'auth/apple/callback', // Apple POSTs back without a Laravel CSRF token
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // ── Render exceptions ──────────────────────────────────────────────
        // API requests (/api/*) always get a JSON response.
        // Web requests fall through to Blade error pages or Laravel's default handler.
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

                // Validation errors keep their detail
                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    return response()->json([
                        'message' => 'The given data was invalid.',
                        'errors'  => $e->errors(),
                    ], 422);
                }

                // Auth errors
                if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    return response()->json(['message' => 'Unauthenticated.'], 401);
                }

                // 404
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    return response()->json(['message' => 'Not found.'], 404);
                }

                // Generic
                $message = app()->environment('production')
                    ? 'An unexpected error occurred. Please try again.'
                    : $e->getMessage();

                return response()->json(['message' => $message], $status >= 400 ? $status : 500);
            }

            // Web: use our branded error pages where they exist
            return null; // null defers to the default handler
        });

        // ── Report exceptions ──────────────────────────────────────────────
        // Log all non-HTTP 4xx errors to the default log channel.
        $exceptions->report(function (\Throwable $e) {
            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 0;
            if ($status >= 500 || $status === 0) {
                \Illuminate\Support\Facades\Log::error($e->getMessage(), [
                    'exception' => get_class($e),
                    'file'      => $e->getFile(),
                    'line'      => $e->getLine(),
                    'trace'     => $e->getTraceAsString(),
                ]);
            }
        })->stop(); // stop() prevents double-reporting via the default reporter
    })->create();
