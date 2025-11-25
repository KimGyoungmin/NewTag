package com.goldenRun.NewTag.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        // HTTP/2 업그레이드 문제 해결을 위해 SimpleClientHttpRequestFactory 사용
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(30000);

        return builder
                .requestFactory(() -> factory)
                .additionalInterceptors(new LoggingInterceptor())
                .build();
    }

    private static class LoggingInterceptor implements ClientHttpRequestInterceptor {
        @Override
        public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
            System.out.println("[RestTemplate] Request URI: " + request.getURI());
            System.out.println("[RestTemplate] Request Method: " + request.getMethod());
            System.out.println("[RestTemplate] Request Headers: " + request.getHeaders());
            System.out.println("[RestTemplate] Request Body: " + new String(body, StandardCharsets.UTF_8));
            System.out.println("[RestTemplate] Request Body Length: " + body.length);

            ClientHttpResponse response = execution.execute(request, body);

            System.out.println("[RestTemplate] Response Status Code: " + response.getStatusCode());
            return response;
        }
    }
}
