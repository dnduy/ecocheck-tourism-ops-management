<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Run;
use App\Policies\RunPolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Interfaces\StatsServiceInterface::class,
            \App\Services\StatsService::class
        );
        $this->app->bind(
            \App\Interfaces\RunServiceInterface::class,
            \App\Services\RunService::class
        );
        $this->app->bind(
            \App\Interfaces\IncidentServiceInterface::class,
            \App\Services\IncidentService::class
        );
        $this->app->bind(
            \App\Interfaces\EntryServiceInterface::class,
            \App\Services\EntryService::class
        );
        $this->app->bind(
            \App\Interfaces\SignoffServiceInterface::class,
            \App\Services\SignoffService::class
        );
        $this->app->bind(
            \App\Interfaces\TemplateServiceInterface::class,
            \App\Services\TemplateService::class
        );
        $this->app->bind(
            \App\Interfaces\AuthServiceInterface::class,
            \App\Services\AuthService::class
        );
        $this->app->bind(
            \App\Interfaces\AreaServiceInterface::class,
            \App\Services\AreaService::class
        );
        $this->app->bind(
            \App\Interfaces\UserServiceInterface::class,
            \App\Services\UserService::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register Policies
        Gate::policy(Run::class, RunPolicy::class);
    }
}
