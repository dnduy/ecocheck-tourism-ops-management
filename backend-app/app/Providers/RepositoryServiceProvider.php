<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Interfaces\Repositories\UserRepositoryInterface::class,
            \App\Repositories\UserRepository::class
        );
        $this->app->bind(
            \App\Interfaces\Repositories\RunRepositoryInterface::class,
            \App\Repositories\RunRepository::class
        );
        $this->app->bind(
            \App\Interfaces\Repositories\IncidentRepositoryInterface::class,
            \App\Repositories\IncidentRepository::class
        );
        $this->app->bind(
            \App\Interfaces\Repositories\EntryRepositoryInterface::class,
            \App\Repositories\EntryRepository::class
        );
        $this->app->bind(
            \App\Interfaces\Repositories\SignoffRepositoryInterface::class,
            \App\Repositories\SignoffRepository::class
        );
        $this->app->bind(
            \App\Interfaces\Repositories\TemplateRepositoryInterface::class,
            \App\Repositories\TemplateRepository::class
        );
        $this->app->bind(
            \App\Interfaces\Repositories\AreaRepositoryInterface::class,
            \App\Repositories\AreaRepository::class
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
