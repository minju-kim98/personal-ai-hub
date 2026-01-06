INFO:     Started server process [2]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
INFO:     100.64.0.2:34317 - "GET /health HTTP/1.1" 200 OK
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
INFO:     100.64.0.3:16598 - "OPTIONS /api/v1/auth/register HTTP/1.1" 200 OK
  File "/usr/local/lib/python3.12/site-packages/fastapi/applications.py", line 1135, in __call__
    await super().__call__(scope, receive, send)
(trapped) error reading bcrypt version
  File "/usr/local/lib/python3.12/site-packages/starlette/applications.py", line 107, in __call__
Traceback (most recent call last):
  File "/usr/local/lib/python3.12/site-packages/passlib/handlers/bcrypt.py", line 620, in _load_backend_mixin
    version = _bcrypt.__about__.__version__
              ^^^^^^^^^^^^^^^^^
AttributeError: module 'bcrypt' has no attribute '__about__'
INFO:     100.64.0.3:16598 - "POST /api/v1/auth/register HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
Traceback (most recent call last):
  File "/usr/local/lib/python3.12/site-packages/uvicorn/protocols/http/httptools_impl.py", line 416, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/uvicorn/middleware/proxy_headers.py", line 60, in __call__
  File "/usr/local/lib/python3.12/site-packages/starlette/routing.py", line 716, in __call__
    await self.middleware_stack(scope, receive, send)
  File "/usr/local/lib/python3.12/site-packages/starlette/middleware/errors.py", line 186, in __call__
    raise exc
  File "/usr/local/lib/python3.12/site-packages/starlette/middleware/errors.py", line 164, in __call__
    await self.app(scope, receive, _send)
  File "/usr/local/lib/python3.12/site-packages/starlette/middleware/cors.py", line 93, in __call__
    await self.simple_response(scope, receive, send, request_headers=headers)
  File "/usr/local/lib/python3.12/site-packages/starlette/middleware/cors.py", line 144, in simple_response
    await self.app(scope, receive, send)
  File "/usr/local/lib/python3.12/site-packages/starlette/middleware/exceptions.py", line 63, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "/usr/local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "/usr/local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "/usr/local/lib/python3.12/site-packages/fastapi/middleware/asyncexitstack.py", line 18, in __call__
    await self.app(scope, receive, send)
    await self.middleware_stack(scope, receive, send)
  File "/usr/local/lib/python3.12/site-packages/starlette/routing.py", line 736, in app
    await route.handle(scope, receive, send)
  File "/usr/local/lib/python3.12/site-packages/starlette/routing.py", line 290, in handle
    await self.app(scope, receive, send)
  File "/usr/local/lib/python3.12/site-packages/fastapi/routing.py", line 115, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "/usr/local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "/usr/local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "/usr/local/lib/python3.12/site-packages/fastapi/routing.py", line 101, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/fastapi/routing.py", line 355, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/fastapi/routing.py", line 243, in run_endpoint_function
    return await dependant.call(**values)
  File "/usr/local/lib/python3.12/site-packages/passlib/utils/handlers.py", line 2254, in _stub_requires_backend
    cls.set_backend()
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/passlib/utils/handlers.py", line 2156, in set_backend
  File "/app/app/api/v1/auth.py", line 36, in register
    password_hash=get_password_hash(user_data.password),
    return owner.set_backend(name, dryrun=dryrun)
                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/app/app/core/security.py", line 30, in get_password_hash
    return pwd_context.hash(password)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/passlib/context.py", line 2258, in hash
    return record.hash(secret, **kwds)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/passlib/utils/handlers.py", line 779, in hash
    self.checksum = self._calc_checksum(secret)
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/passlib/handlers/bcrypt.py", line 591, in _calc_checksum
    self._stub_requires_backend()
    return mixin_cls._finalize_backend_mixin(name, dryrun)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/passlib/handlers/bcrypt.py", line 421, in _finalize_backend_mixin
    if detect_wrap_bug(IDENT_2A):
  File "/usr/local/lib/python3.12/site-packages/passlib/utils/handlers.py", line 2163, in set_backend
       ^^^^^^^^^^^^^^^^^^^^^^^^^
    return cls.set_backend(name, dryrun=dryrun)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/passlib/handlers/bcrypt.py", line 380, in detect_wrap_bug
  File "/usr/local/lib/python3.12/site-packages/passlib/utils/handlers.py", line 2188, in set_backend
    if verify(secret, bug_hash):
    cls._set_backend(name, dryrun)
       ^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/passlib/utils/handlers.py", line 2311, in _set_backend
    super(SubclassBackendMixin, cls)._set_backend(name, dryrun)
  File "/usr/local/lib/python3.12/site-packages/passlib/utils/handlers.py", line 2224, in _set_backend
    ok = loader(**kwds)
         ^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/passlib/handlers/bcrypt.py", line 626, in _load_backend_mixin
  File "/usr/local/lib/python3.12/site-packages/passlib/utils/handlers.py", line 792, in verify
    return consteq(self._calc_checksum(secret), chk)
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/passlib/handlers/bcrypt.py", line 655, in _calc_checksum
    hash = _bcrypt.hashpw(secret, config)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
ValueError: password cannot be longer than 72 bytes, truncate manually if necessary (e.g. my_password[:72])