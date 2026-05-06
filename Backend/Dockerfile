FROM python:3.12

ARG http_proxy
ARG https_proxy
ARG no_proxy

ENV HTTP_PROXY=$http_proxy
ENV HTTPS_PROXY=$https_proxy
ENV NO_PROXY=$no_proxy

WORKDIR /app

RUN apt-get update && \
    apt-get install -y locales && \
    sed -i '/fr_FR.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen fr_FR.UTF-8 && \
    update-locale LANG=fr_FR.UTF-8

ENV LANG=fr_FR.UTF-8 \
    LANGUAGE=fr_FR:fr \
    LC_ALL=fr_FR.UTF-8

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN apt-get install -y nano bash-completion

RUN python manage.py collectstatic --noinput

RUN echo "source /etc/profile.d/bash_completion.sh" >> ~/.bashrc

EXPOSE 8000

CMD ["gunicorn", "core.asgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker"]